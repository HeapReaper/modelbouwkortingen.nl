import "server-only";

import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/i18n/config";
import { getPrisma } from "@/lib/db";
import { type Deal, getDealsSince, pickDigest } from "@/lib/deals";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { confirmationMail, digestMail } from "@/lib/newsletter-mail";
import type { DealPreferences } from "@/lib/preferences";
import { BACKGROUND, localizeDeals } from "@/lib/translate";

const TIME_ZONE = "Europe/Amsterdam";
const DIGEST_SIZE = 12;
/** Niet vaker dan dit een nieuwe bevestigingsmail naar hetzelfde adres. */
const RESEND_AFTER_MS = 10 * 60_000;

const newToken = () => randomBytes(24).toString("base64url");

/**
 * Meldt een adres aan en stuurt de bevestigingsmail. Geeft bewust geen verschil terug
 * tussen nieuwe en bestaande adressen, zodat het formulier niet verraadt wie al abonnee is.
 */
export async function subscribe(rawEmail: string, lang: Locale): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  const prisma = getPrisma();
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });
  if (existing?.confirmedAt && !existing.unsubscribedAt) return;
  if (
    existing?.confirmationSentAt &&
    Date.now() - existing.confirmationSentAt.getTime() < RESEND_AFTER_MS
  )
    return;

  const token = newToken();
  // Opnieuw aanmelden na afmelden vraagt weer om bevestiging.
  const data = {
    token,
    locale: lang,
    confirmedAt: null,
    unsubscribedAt: null,
    confirmationSentAt: new Date(),
  };
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, ...data },
    update: data,
  });

  const mail = confirmationMail(email, token, lang);
  if (!isMailConfigured()) {
    console.info(
      "[nieuwsbrief] SMTP niet ingesteld; bevestigingslink:",
      mail.text.match(/https?:\/\/\S+bevestigen\S+/)?.[0],
    );
    return;
  }
  await sendMail(mail);
}

/** Bevestigt een aanmelding. false = onbekende of verlopen link. */
export async function confirm(token: string): Promise<boolean> {
  const { count } = await getPrisma().newsletterSubscriber.updateMany({
    where: { token, unsubscribedAt: null },
    data: { confirmedAt: new Date() },
  });
  return count > 0;
}

/** Meldt af. Het adres blijft bewaard (afgemeld), zodat het geen mail meer krijgt. */
export async function unsubscribe(token: string): Promise<boolean> {
  const { count } = await getPrisma().newsletterSubscriber.updateMany({
    where: { token },
    data: { unsubscribedAt: new Date() },
  });
  return count > 0;
}

/** Voorkeuren van een abonnee, of null bij een onbekende of afgemelde link. */
export async function getPreferences(
  token: string,
): Promise<DealPreferences | null> {
  const sub = await getPrisma().newsletterSubscriber.findUnique({
    where: { token },
    select: {
      categories: true,
      shops: true,
      minDiscount: true,
      unsubscribedAt: true,
    },
  });
  if (!sub || sub.unsubscribedAt) return null;
  return {
    categories: sub.categories,
    shops: sub.shops,
    minDiscount: sub.minDiscount,
  };
}

export async function savePreferences(
  token: string,
  prefs: DealPreferences,
): Promise<boolean> {
  const { count } = await getPrisma().newsletterSubscriber.updateMany({
    where: { token, unsubscribedAt: null },
    data: prefs,
  });
  return count > 0;
}

/** Datum ("YYYY-MM-DD") en uur in Nederlandse tijd. */
function amsterdamNow(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
  };
}

export type DigestResult =
  | { status: "not-configured" | "not-yet" | "already-sent" }
  | { status: "skipped"; reason: string }
  | {
      status: "ok" | "failed";
      deals: number;
      recipients: number;
      errors: number;
    };

/**
 * Verstuurt de dagelijkse kortingsmail, hooguit één keer per (Nederlandse) dag en niet
 * vóór NEWSLETTER_SEND_HOUR. Wordt elke paar minuten aangeroepen door de planner in
 * instrumentation.ts; `ignoreHour` is voor handmatig versturen.
 */
export async function sendDailyDigest(
  opts: { ignoreHour?: boolean } = {},
): Promise<DigestResult> {
  if (!isMailConfigured()) return { status: "not-configured" };
  const { day, hour } = amsterdamNow();
  const sendHour = Number(process.env.NEWSLETTER_SEND_HOUR ?? 8);
  if (!opts.ignoreHour && hour < sendHour) return { status: "not-yet" };

  const prisma = getPrisma();
  const previous = await prisma.newsletterRun.findFirst({
    where: { status: "ok" },
    orderBy: { day: "desc" },
  });
  // De primary key op `day` is het slot: een tweede aanroep (of tweede server) faalt hier.
  try {
    await prisma.newsletterRun.create({
      data: { day: new Date(`${day}T00:00:00Z`) },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    )
      return { status: "already-sent" };
    throw err;
  }
  const finish = (data: Prisma.NewsletterRunUpdateInput) =>
    prisma.newsletterRun.update({
      where: { day: new Date(`${day}T00:00:00Z`) },
      data: { finishedAt: new Date(), ...data },
    });

  // Nieuwe deals sinds de vorige verzonden mail (eerste keer, of lang geleden: laatste 24 uur).
  const dayAgo = new Date(Date.now() - 24 * 60 * 60_000);
  const since =
    previous && previous.startedAt > new Date(Date.now() - 7 * 24 * 60 * 60_000)
      ? previous.startedAt
      : dayAgo;
  // Alle kandidaten; per abonnee filteren we op voorkeuren en kiezen we er DIGEST_SIZE.
  const candidates = await getDealsSince(since);
  const deals = pickDigest(candidates, undefined, DIGEST_SIZE);
  if (deals.length === 0) {
    await finish({ status: "skipped", message: "geen nieuwe deals" });
    return { status: "skipped", reason: "geen nieuwe deals" };
  }

  // Kandidaten per taal (Duitse productnamen vertaald), pas opgehaald als een abonnee die taal heeft.
  const localized = new Map<Locale, Deal[]>();
  const candidatesIn = async (lang: Locale) => {
    let list = localized.get(lang);
    if (!list) {
      list = await localizeDeals(candidates, lang, BACKGROUND);
      localized.set(lang, list);
    }
    return list;
  };

  let recipients = 0;
  let errors = 0;
  let lastError: string | undefined;
  let cursor: bigint | undefined;
  for (;;) {
    const batch = await prisma.newsletterSubscriber.findMany({
      where: { confirmedAt: { not: null }, unsubscribedAt: null },
      select: {
        id: true,
        email: true,
        token: true,
        locale: true,
        categories: true,
        shops: true,
        minDiscount: true,
      },
      orderBy: { id: "asc" },
      take: 200,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (batch.length === 0) break;
    const sent: bigint[] = [];
    for (const s of batch) {
      // In de taal van de site op het moment van aanmelden.
      const lang = hasLocale(s.locale) ? s.locale : DEFAULT_LOCALE;
      const own = pickDigest(await candidatesIn(lang), s, DIGEST_SIZE);
      // Niets nieuws binnen de voorkeuren: dan ook geen mail.
      if (own.length === 0) continue;
      try {
        await sendMail(digestMail(s.email, s.token, own, lang));
        sent.push(s.id);
      } catch (err) {
        errors++;
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
    if (sent.length > 0) {
      await prisma.newsletterSubscriber.updateMany({
        where: { id: { in: sent } },
        data: { lastSentAt: new Date() },
      });
    }
    recipients += sent.length;
    cursor = batch[batch.length - 1].id;
  }

  // Alles mislukt (bv. verkeerde SMTP-instellingen): "failed", dan telt deze run niet als
  // vorige mail en komen dezelfde deals morgen opnieuw mee.
  const status = recipients === 0 && errors > 0 ? "failed" : "ok";
  await finish({
    status,
    deals: deals.length,
    recipients,
    errors,
    message: lastError ?? null,
  });
  console.info(
    `[nieuwsbrief] ${day}: ${deals.length} deals naar ${recipients} abonnees (${errors} fouten)`,
  );
  return { status, deals: deals.length, recipients, errors };
}
