import "server-only";

import { randomBytes } from "node:crypto";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/i18n/config";
import { getPrisma, num } from "@/lib/db";
import { type Deal, getDeal } from "@/lib/deals";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { alertConfirmMail, alertTriggeredMail } from "@/lib/newsletter-mail";
import { BACKGROUND, localizeDeals } from "@/lib/translate";

/**
 * Prijsalarm: een bezoeker kiest een doelprijs voor één product en krijgt één mail zodra de
 * prijs daar op of onder komt. Net als de kortingsmail met double opt-in, zodat niemand
 * alarmen voor andermans adres kan zetten.
 */

/** Zoveel lopende alarmen per e-mailadres. */
const MAX_ACTIVE_PER_EMAIL = 25;
/** Niet vaker dan dit een nieuwe bevestigingsmail voor hetzelfde alarm. */
const RESEND_AFTER_MS = 10 * 60_000;
/** Een prijs die we zo lang niet zagen, is te oud om op te alarmeren. */
const MAX_PRICE_AGE_MS = 2 * 24 * 60 * 60_000;

const newToken = () => randomBytes(24).toString("base64url");

/** Bij een fout de sleutel van de melding in dict.priceAlert. */
export type CreateAlertResult =
  | { ok: true }
  | { ok: false; error: "notFound" | "targetTooHigh" | "tooMany" };

/**
 * `confirmed`: het adres is al bevestigd (ingelogd account met dit adres), dus geen
 * bevestigingsmail en het alarm staat meteen aan.
 */
export async function createAlert(
  rawEmail: string,
  productId: number,
  targetPrice: number,
  lang: Locale,
  { confirmed = false }: { confirmed?: boolean } = {},
): Promise<CreateAlertResult> {
  const email = rawEmail.trim().toLowerCase();
  const deal = await getDeal(productId);
  if (!deal) return { ok: false, error: "notFound" };
  if (targetPrice >= deal.price) return { ok: false, error: "targetTooHigh" };

  const prisma = getPrisma();
  const active = { email, triggeredAt: null, cancelledAt: null };
  const existing = await prisma.priceAlert.findFirst({
    where: { ...active, productId: BigInt(productId) },
  });
  if (existing) {
    // Zelfde product opnieuw: alleen de doelprijs bijwerken. Al bevestigd = klaar.
    await prisma.priceAlert.update({
      where: { id: existing.id },
      data: {
        targetPrice,
        locale: lang,
        ...(confirmed && !existing.confirmedAt
          ? { confirmedAt: new Date() }
          : {}),
      },
    });
    if (
      confirmed ||
      existing.confirmedAt ||
      Date.now() - existing.createdAt.getTime() < RESEND_AFTER_MS
    )
      return { ok: true };
    await sendConfirmation(email, existing.token, deal, targetPrice, lang);
    return { ok: true };
  }

  if (
    (await prisma.priceAlert.count({ where: active })) >= MAX_ACTIVE_PER_EMAIL
  )
    return { ok: false, error: "tooMany" };

  const token = newToken();
  await prisma.priceAlert.create({
    data: {
      email,
      productId: BigInt(productId),
      targetPrice,
      token,
      locale: lang,
      confirmedAt: confirmed ? new Date() : null,
    },
  });
  if (!confirmed) await sendConfirmation(email, token, deal, targetPrice, lang);
  return { ok: true };
}

async function sendConfirmation(
  email: string,
  token: string,
  deal: Deal,
  targetPrice: number,
  lang: Locale,
) {
  const [named] = await localizeDeals([deal], lang, BACKGROUND);
  const mail = alertConfirmMail(email, token, named, targetPrice, lang);
  if (!isMailConfigured()) {
    console.info(
      "[prijsalarm] SMTP niet ingesteld; bevestigingslink:",
      mail.text.match(/https?:\/\/\S+bevestigen\S+/)?.[0],
    );
    return;
  }
  await sendMail(mail);
}

/** Bevestigt een alarm. false = onbekende, afgemelde of al verstuurde link. */
export async function confirmAlert(token: string): Promise<boolean> {
  const { count } = await getPrisma().priceAlert.updateMany({
    where: { token, cancelledAt: null, triggeredAt: null },
    data: { confirmedAt: new Date() },
  });
  return count > 0;
}

export async function cancelAlert(token: string): Promise<boolean> {
  const { count } = await getPrisma().priceAlert.updateMany({
    where: { token, cancelledAt: null },
    data: { cancelledAt: new Date() },
  });
  return count > 0;
}

export type AlertRunResult = {
  status: "ok" | "busy" | "not-configured";
  checked?: number;
  sent?: number;
  errors?: number;
};

let running = false;

/**
 * Verstuurt de alarmen waarvan de doelprijs bereikt is. Wordt elke paar minuten aangeroepen
 * door de planner (instrumentation.ts). Een alarm wordt eerst geclaimd (triggered_at), zodat
 * het ook met meerdere servers maar één keer verstuurd wordt; mislukt de mail, dan wordt de
 * claim teruggedraaid en proberen we het de volgende ronde opnieuw.
 */
export async function sendDueAlerts(): Promise<AlertRunResult> {
  if (!isMailConfigured()) return { status: "not-configured" };
  if (running) return { status: "busy" };
  running = true;
  try {
    const prisma = getPrisma();
    // Twee kolommen uit verschillende tabellen vergelijken kan niet met de ORM.
    const due = await prisma.$queryRaw<{ id: bigint; price: unknown }[]>`
      SELECT a.id, p.price
      FROM price_alerts a
      JOIN products p ON p.id = a.product_id
      JOIN shops s ON s.id = p.shop_id
      WHERE a.confirmed_at IS NOT NULL
        AND a.triggered_at IS NULL
        AND a.cancelled_at IS NULL
        AND s.enabled
        AND NOT p.hidden
        AND p.price <= a.target_price
        AND p.in_stock IS DISTINCT FROM false
        AND p.last_seen_at > ${new Date(Date.now() - MAX_PRICE_AGE_MS)}
      ORDER BY a.id
      LIMIT 500`;

    let sent = 0;
    let errors = 0;
    for (const row of due) {
      const price = num(row.price as { toString(): string });
      const { count } = await prisma.priceAlert.updateMany({
        where: { id: row.id, triggeredAt: null, cancelledAt: null },
        data: { triggeredAt: new Date(), triggeredPrice: price },
      });
      if (count === 0) continue;
      const alert = await prisma.priceAlert.findUniqueOrThrow({
        where: { id: row.id },
      });
      try {
        const found = await getDeal(num(alert.productId));
        if (!found) continue;
        // In de taal van de site op het moment dat het alarm werd ingesteld.
        const lang = hasLocale(alert.locale) ? alert.locale : DEFAULT_LOCALE;
        const [deal] = await localizeDeals([found], lang, BACKGROUND);
        await sendMail(
          alertTriggeredMail(alert.email, deal, num(alert.targetPrice), lang),
        );
        sent++;
      } catch (err) {
        errors++;
        console.error(`[prijsalarm] alarm ${alert.id} mislukt`, err);
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { triggeredAt: null, triggeredPrice: null },
        });
      }
    }
    if (sent > 0 || errors > 0)
      console.info(`[prijsalarm] ${sent} alarmen verstuurd (${errors} fouten)`);
    return { status: "ok", checked: due.length, sent, errors };
  } finally {
    running = false;
  }
}
