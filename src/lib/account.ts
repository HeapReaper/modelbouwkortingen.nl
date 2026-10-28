import "server-only";

import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/config";
import {
  burnPasswordCheck,
  hashPassword,
  newToken,
  startSession,
  tokenHash,
  verifyPassword,
} from "@/lib/auth";
import { getPrisma, num } from "@/lib/db";
import { isMailConfigured, type Mail, sendMail } from "@/lib/mail";
import {
  accountExistsMail,
  accountVerifyMail,
  emailChangedMail,
  emailChangeMail,
  passwordResetMail,
} from "@/lib/newsletter-mail";
import type { DealPreferences } from "@/lib/preferences";
import { localizeDeals } from "@/lib/translate";

/**
 * Accounts: registreren, bevestigen, inloggen, wachtwoord herstellen en verwijderen, plus de
 * gegevens die bij een account horen. Prijsalarmen en de kortingsmail hangen aan het
 * e-mailadres; omdat inloggen pas na bevestiging van dat adres kan, mag het account ze beheren.
 */

const VERIFY_HOURS = 48;
const RESET_HOURS = 1;
/** Niet vaker dan dit een nieuwe mail (bevestigen/herstellen) naar hetzelfde account. */
const RESEND_AFTER_MS = 2 * 60_000;
export const WATCHLIST_MAX = 100;

async function deliver(mail: Mail, label: string) {
  if (!isMailConfigured()) {
    console.info(
      `[account] SMTP niet ingesteld; ${label}:`,
      mail.text.match(/https?:\/\/\S+token=\S+/)?.[0],
    );
    return;
  }
  await sendMail(mail);
}

type TokenPurpose = "verify" | "reset" | "email";

/**
 * Maakt een eenmalige maillink; oudere links met hetzelfde doel vervallen. Zonder `newEmail`
 * hooguit één mail per RESEND_AFTER_MS (registreren en herstellen kan iedereen aanvragen); een
 * adreswijziging vraagt het wachtwoord, dus een verbeterde typfout mag meteen opnieuw.
 */
async function issueToken(
  userId: bigint,
  purpose: TokenPurpose,
  hours: number,
  newEmail?: string,
): Promise<string | null> {
  const prisma = getPrisma();
  const last = await prisma.userToken.findFirst({
    where: { userId, purpose },
    orderBy: { createdAt: "desc" },
  });
  if (
    !newEmail &&
    last &&
    Date.now() - last.createdAt.getTime() < RESEND_AFTER_MS
  )
    return null;
  const token = newToken();
  await prisma.userToken.deleteMany({ where: { userId, purpose } });
  await prisma.userToken.create({
    data: {
      id: tokenHash(token),
      userId,
      purpose,
      newEmail,
      expiresAt: new Date(Date.now() + hours * 60 * 60_000),
    },
  });
  return token;
}

/** Gebruikt een maillink; geeft de tokenrij terug, of null bij een onbekende/verlopen link. */
async function consumeToken(token: string, purpose: TokenPurpose) {
  const prisma = getPrisma();
  const row = await prisma.userToken.findUnique({
    where: { id: tokenHash(token) },
  });
  if (!row || row.purpose !== purpose) return null;
  await prisma.userToken.delete({ where: { id: row.id } });
  if (row.expiresAt < new Date()) return null;
  return row;
}

/**
 * Registreert een account en stuurt de bevestigingsmail. Geeft bewust geen verschil terug
 * tussen nieuwe en bestaande adressen: een bevestigd account krijgt in plaats daarvan een mail
 * met een link om in te loggen of het wachtwoord te herstellen.
 */
export async function register(
  rawEmail: string,
  password: string,
  lang: Locale,
): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerifiedAt) {
    // Wel een tokencheck, zodat dit adres niet onbeperkt gemaild kan worden.
    const token = await issueToken(existing.id, "reset", RESET_HOURS);
    if (token)
      await deliver(accountExistsMail(email, token, lang), "herstellink");
    return;
  }
  const passwordHash = await hashPassword(password);
  // Nog niet bevestigd: het nieuwste wachtwoord wint, zodat niemand een adres kan "claimen"
  // met een wachtwoord dat de echte eigenaar niet kent.
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, locale: lang },
    update: { passwordHash, locale: lang },
  });
  const token = await issueToken(user.id, "verify", VERIFY_HOURS);
  if (token)
    await deliver(accountVerifyMail(email, token, lang), "bevestigingslink");
}

/** Bevestigt het e-mailadres en logt meteen in. false = onbekende of verlopen link. */
export async function verifyEmail(token: string): Promise<boolean> {
  const userId = (await consumeToken(token, "verify"))?.userId;
  if (userId === undefined) return false;
  await getPrisma().user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
  await startSession(userId);
  return true;
}

export type LoginResult = "ok" | "invalid" | "unverified";

export async function login(
  rawEmail: string,
  password: string,
  lang: Locale,
): Promise<LoginResult> {
  const email = rawEmail.trim().toLowerCase();
  const user = await getPrisma().user.findUnique({ where: { email } });
  if (!user) {
    await burnPasswordCheck(password);
    return "invalid";
  }
  if (!(await verifyPassword(password, user.passwordHash))) return "invalid";
  if (!user.emailVerifiedAt) {
    // Alleen wie het wachtwoord kent, hoort dat het account nog bevestigd moet worden.
    const token = await issueToken(user.id, "verify", VERIFY_HOURS);
    if (token)
      await deliver(accountVerifyMail(email, token, lang), "bevestigingslink");
    return "unverified";
  }
  await startSession(user.id);
  return "ok";
}

/** Stuurt een herstellink; zegt niets over of het adres een account heeft. */
export async function requestPasswordReset(
  rawEmail: string,
  lang: Locale,
): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  const user = await getPrisma().user.findUnique({ where: { email } });
  if (!user) return;
  const token = await issueToken(user.id, "reset", RESET_HOURS);
  if (token)
    await deliver(passwordResetMail(email, token, lang), "herstellink");
}

/**
 * Nieuw wachtwoord via de herstellink. Alle sessies vervallen; daarna is de gebruiker op dit
 * apparaat ingelogd. De link bewijst ook dat het adres van de gebruiker is.
 */
export async function resetPassword(
  token: string,
  password: string,
): Promise<boolean> {
  const userId = (await consumeToken(token, "reset"))?.userId;
  if (userId === undefined) return false;
  const prisma = getPrisma();
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(password),
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.userSession.deleteMany({ where: { userId } });
  await startSession(userId);
  return true;
}

/** Wachtwoord wijzigen terwijl je ingelogd bent; andere sessies worden uitgelogd. */
export async function changePassword(
  userId: number,
  current: string,
  next: string,
): Promise<boolean> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
  if (!user || !(await verifyPassword(current, user.passwordHash)))
    return false;
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });
  await prisma.userSession.deleteMany({ where: { userId: user.id } });
  await startSession(user.id);
  return true;
}

/**
 * Nieuw e-mailadres: eerst het wachtwoord, dan een bevestigingslink naar het nieuwe adres. Tot
 * de klik blijft het oude adres actief. Of het nieuwe adres al een account heeft, blijkt pas
 * bij het bevestigen (dan is de klikker de eigenaar van dat adres).
 */
export async function requestEmailChange(
  userId: number,
  password: string,
  rawEmail: string,
  lang: Locale,
): Promise<"ok" | "wrongPassword" | "same"> {
  const user = await getPrisma().user.findUnique({
    where: { id: BigInt(userId) },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return "wrongPassword";
  const email = rawEmail.trim().toLowerCase();
  if (email === user.email) return "same";
  const token = await issueToken(user.id, "email", VERIFY_HOURS, email);
  if (token)
    await deliver(
      emailChangeMail(email, token, lang),
      "bevestigingslink nieuw adres",
    );
  return "ok";
}

/**
 * Zet het nieuwe adres na de klik in de mail. Prijsalarmen en de kortingsmail hangen aan het
 * adres en gaan mee; het oude adres krijgt een melding (voor als iemand anders dit deed).
 */
export async function confirmEmailChange(
  token: string,
  lang: Locale,
): Promise<"ok" | "invalid" | "taken"> {
  const row = await consumeToken(token, "email");
  if (!row?.newEmail) return "invalid";
  const email = row.newEmail;
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (!user) return "invalid";
  if (user.email === email) return "ok";
  const old = user.email;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { email } });
      await tx.priceAlert.updateMany({
        where: { email: old },
        data: { email },
      });
      // Had het nieuwe adres al een aanmelding, dan blijft die; anders verhuist de oude.
      const existing = await tx.newsletterSubscriber.findUnique({
        where: { email },
      });
      if (existing)
        await tx.newsletterSubscriber.deleteMany({ where: { email: old } });
      else
        await tx.newsletterSubscriber.updateMany({
          where: { email: old },
          data: { email },
        });
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    )
      return "taken";
    throw err;
  }
  try {
    await deliver(emailChangedMail(old, email, lang), "melding oud adres");
  } catch (err) {
    console.error("[account] melding naar oud adres mislukt", err);
  }
  return "ok";
}

/**
 * Verwijdert het account met sessies en volglijst, en ook de prijsalarmen en de
 * kortingsmail-aanmelding op hetzelfde adres; gekoppelde Discord-webhooks gaan uit. Vraagt het
 * wachtwoord ter bevestiging.
 */
export async function deleteAccount(
  userId: number,
  password: string,
): Promise<boolean> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return false;
  await prisma.$transaction([
    prisma.priceAlert.deleteMany({ where: { email: user.email } }),
    prisma.newsletterSubscriber.deleteMany({ where: { email: user.email } }),
    prisma.discordSubscriber.updateMany({
      where: { userId: user.id, disabledAt: null },
      data: { disabledAt: new Date(), disabledReason: "account verwijderd" },
    }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  return true;
}

// ---------------------------------------------------------------- volglijst

/** Product-id's op de volglijst, nieuwste eerst. */
export async function getWatchlist(userId: number): Promise<number[]> {
  const rows = await getPrisma().watchlistItem.findMany({
    where: { userId: BigInt(userId) },
    orderBy: { createdAt: "desc" },
    take: WATCHLIST_MAX,
    select: { productId: true },
  });
  return rows.map((r) => num(r.productId));
}

/** Voegt producten toe (bestaande en onbekende id's worden overgeslagen). */
export async function addToWatchlist(userId: number, productIds: number[]) {
  const ids = [
    ...new Set(productIds.filter((id) => Number.isSafeInteger(id) && id > 0)),
  ].slice(0, WATCHLIST_MAX);
  if (ids.length === 0) return;
  const prisma = getPrisma();
  const existing = await prisma.product.findMany({
    where: { id: { in: ids.map(BigInt) } },
    select: { id: true },
  });
  // Oudste eerst invoegen, zodat de volgorde (nieuwste eerst) gelijk blijft aan de lijst.
  const now = Date.now();
  const known = new Set(existing.map((p) => num(p.id)));
  await prisma.watchlistItem.createMany({
    data: ids
      .filter((id) => known.has(id))
      .map((id, i) => ({
        userId: BigInt(userId),
        productId: BigInt(id),
        createdAt: new Date(now - i),
      })),
    skipDuplicates: true,
  });
}

export async function removeFromWatchlist(userId: number, productId: number) {
  if (!Number.isSafeInteger(productId) || productId <= 0) return;
  await getPrisma().watchlistItem.deleteMany({
    where: { userId: BigInt(userId), productId: BigInt(productId) },
  });
}

// ---------------------------------------------------------------- prijsalarmen

export type AccountAlert = {
  id: number;
  productId: number;
  name: string;
  shopSlug: string;
  categorySlug: string;
  imageUrl: string | null;
  price: number;
  targetPrice: number;
  status: "active" | "pending" | "triggered" | "cancelled";
  triggeredAt: string | null;
  triggeredPrice: number | null;
};

/**
 * Alle prijsalarmen op het adres van het account (geannuleerde van de laatste 30 dagen), met
 * vertaalde namen voor producten van anderstalige webshops.
 */
export async function getAlerts(
  email: string,
  lang: Locale,
): Promise<AccountAlert[]> {
  const rows = await getPrisma().priceAlert.findMany({
    where: {
      email,
      OR: [
        { cancelledAt: null },
        { cancelledAt: { gt: new Date(Date.now() - 30 * 24 * 60 * 60_000) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: {
        select: {
          name: true,
          imageUrl: true,
          categorySlug: true,
          price: true,
          shop: { select: { slug: true } },
        },
      },
    },
  });
  const products = await localizeDeals(
    rows.map((a) => ({
      id: num(a.productId),
      name: a.product.name,
      shopSlug: a.product.shop.slug,
    })),
    lang,
  );
  const names = new Map(products.map((p) => [p.id, p.name]));
  return rows.map((a) => ({
    id: num(a.id),
    productId: num(a.productId),
    name: names.get(num(a.productId)) ?? a.product.name,
    shopSlug: a.product.shop.slug,
    categorySlug: a.product.categorySlug,
    imageUrl: a.product.imageUrl,
    price: num(a.product.price),
    targetPrice: num(a.targetPrice),
    status: a.cancelledAt
      ? "cancelled"
      : a.triggeredAt
        ? "triggered"
        : a.confirmedAt
          ? "active"
          : "pending",
    triggeredAt: a.triggeredAt?.toISOString() ?? null,
    triggeredPrice: a.triggeredPrice === null ? null : num(a.triggeredPrice),
  }));
}

/** Doelprijs aanpassen; een niet-bevestigd alarm wordt meteen bevestigd. */
export async function updateAlertTarget(
  email: string,
  alertId: number,
  targetPrice: number,
): Promise<boolean> {
  const { count } = await getPrisma().priceAlert.updateMany({
    where: { id: BigInt(alertId), email, triggeredAt: null, cancelledAt: null },
    data: { targetPrice, confirmedAt: new Date() },
  });
  return count > 0;
}

export async function cancelAccountAlert(
  email: string,
  alertId: number,
): Promise<boolean> {
  const { count } = await getPrisma().priceAlert.updateMany({
    where: { id: BigInt(alertId), email, cancelledAt: null },
    data: { cancelledAt: new Date() },
  });
  return count > 0;
}

// ---------------------------------------------------------------- kortingsmail

export type AccountNewsletter = {
  subscribed: boolean;
  /** Token van de aanmelding, voor het bestaande voorkeurenformulier. */
  token: string | null;
  prefs: DealPreferences;
};

export async function getNewsletter(email: string): Promise<AccountNewsletter> {
  const sub = await getPrisma().newsletterSubscriber.findUnique({
    where: { email },
  });
  const subscribed = Boolean(sub?.confirmedAt && !sub.unsubscribedAt);
  return {
    subscribed,
    token: subscribed && sub ? sub.token : null,
    prefs: {
      categories: sub?.categories ?? [],
      shops: sub?.shops ?? [],
      minDiscount: sub?.minDiscount ?? 0,
    },
  };
}

/** Aan- of afmelden zonder bevestigingsmail: het adres is al bevestigd via het account. */
export async function setNewsletter(
  email: string,
  subscribed: boolean,
  lang: Locale,
) {
  const prisma = getPrisma();
  if (!subscribed) {
    await prisma.newsletterSubscriber.updateMany({
      where: { email, unsubscribedAt: null },
      data: { unsubscribedAt: new Date() },
    });
    return;
  }
  const now = new Date();
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      email,
      token: randomBytes(24).toString("base64url"),
      locale: lang,
      confirmedAt: now,
    },
    update: { confirmedAt: now, unsubscribedAt: null, locale: lang },
  });
}
