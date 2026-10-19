"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import {
  type CrawlerLogFilter,
  type CrawlerLogs,
  getCrawlerLogs,
  startCrawl,
} from "@/lib/admin";
import { isAuthorized } from "@/lib/admin-auth";
import { getPrisma, isDbConfigured } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { dateOnly, forgetPromotions, todayNL } from "@/lib/promotions";
import { forgetServiceStatus } from "@/lib/service-status";
import {
  forgetSiteContact,
  normalizePhone,
  normalizeUrl,
} from "@/lib/site-contact";
import { isSocialPlatform } from "@/lib/social-platforms";

async function assertLoggedIn() {
  if (!isAuthorized((await headers()).get("authorization")))
    throw new Error("Niet ingelogd");
}

async function assertAdmin() {
  await assertLoggedIn();
  if (!isDbConfigured()) throw new Error("Geen database");
}

export async function recheckServices() {
  await assertLoggedIn();
  forgetServiceStatus();
  refresh();
}

/** Voor het logvenster in het admin panel (pollt elke paar seconden). */
export async function fetchCrawlerLogs(
  filter: CrawlerLogFilter,
): Promise<CrawlerLogs> {
  await assertLoggedIn();
  return getCrawlerLogs(filter);
}

/** Handmatig een crawl-ronde voor één shop starten. null = gestart, anders de fout. */
export async function crawlShopNow(shop: string): Promise<string | null> {
  await assertLoggedIn();
  const error = await startCrawl(shop);
  // Even wachten zodat de kaart bij het verversen al "sitemap" toont in plaats van "idle".
  if (!error) await new Promise((r) => setTimeout(r, 500));
  refresh();
  return error;
}

export type TestMailState = { error?: string; sentTo?: string; at?: number };

/** Verstuurt een testmail via dezelfde SMTP-instellingen als de kortingsmail. */
export async function sendTestMail(
  _prev: TestMailState,
  form: FormData,
): Promise<TestMailState> {
  await assertLoggedIn();
  const to = String(form.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { error: "Vul een geldig e-mailadres in." };
  }
  const sentAt = new Date().toLocaleString("nl-NL", {
    timeZone: "Europe/Amsterdam",
  });
  try {
    await sendMail({
      to,
      subject: "Testmail van Modelbouwkortingen.nl",
      text: `Deze testmail is verstuurd vanuit het adminpanel op ${sentAt}. De SMTP-instellingen werken.`,
      html: `<p>Deze testmail is verstuurd vanuit het adminpanel op ${sentAt}.</p><p>De SMTP-instellingen werken.</p>`,
    });
  } catch (err) {
    return {
      error: `Versturen mislukt: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  return { sentTo: to, at: Date.now() };
}

export async function toggleMessageHandled(id: number, handled: boolean) {
  await assertAdmin();
  await getPrisma().contactMessage.updateMany({
    where: { id: BigInt(id) },
    data: { handled },
  });
  refresh();
}

export async function deleteMessage(id: number) {
  await assertAdmin();
  await getPrisma().contactMessage.deleteMany({ where: { id: BigInt(id) } });
  refresh();
}

/** Crawlermelding afhandelen; zonder runId alle open meldingen. */
export async function resolveCrawlAlerts(runId?: number) {
  await assertAdmin();
  await getPrisma().crawlAlert.updateMany({
    where: {
      resolvedAt: null,
      ...(runId === undefined ? {} : { runId: BigInt(runId) }),
    },
    data: { resolvedAt: new Date() },
  });
  refresh();
}

export async function toggleShopEnabled(slug: string, enabled: boolean) {
  await assertAdmin();
  await getPrisma().shop.updateMany({ where: { slug }, data: { enabled } });
  refresh();
}

export type ContactFormState = { error?: string; ok?: number };

export async function addPhoneNumber(
  _prev: ContactFormState,
  form: FormData,
): Promise<ContactFormState> {
  await assertAdmin();
  const number = normalizePhone(String(form.get("number") ?? ""));
  if (!number) return { error: "Vul een geldig telefoonnummer in." };
  const label = String(form.get("label") ?? "")
    .trim()
    .slice(0, 40);
  await getPrisma().phoneNumber.create({ data: { number, label } });
  forgetSiteContact();
  refresh();
  return { ok: Date.now() };
}

export async function togglePhoneNumber(id: number, enabled: boolean) {
  await assertAdmin();
  await getPrisma().phoneNumber.updateMany({
    where: { id },
    data: { enabled },
  });
  forgetSiteContact();
  refresh();
}

export async function deletePhoneNumber(id: number) {
  await assertAdmin();
  await getPrisma().phoneNumber.deleteMany({ where: { id } });
  forgetSiteContact();
  refresh();
}

export async function addSocialLink(
  _prev: ContactFormState,
  form: FormData,
): Promise<ContactFormState> {
  await assertAdmin();
  const platform = form.get("platform");
  if (!isSocialPlatform(platform)) return { error: "Kies een platform." };
  const url = normalizeUrl(String(form.get("url") ?? ""));
  if (!url) return { error: "Vul een geldige link in." };
  await getPrisma().socialLink.create({ data: { platform, url } });
  forgetSiteContact();
  refresh();
  return { ok: Date.now() };
}

export async function toggleSocialLink(id: number, enabled: boolean) {
  await assertAdmin();
  await getPrisma().socialLink.updateMany({ where: { id }, data: { enabled } });
  forgetSiteContact();
  refresh();
}

export async function deleteSocialLink(id: number) {
  await assertAdmin();
  await getPrisma().socialLink.deleteMany({ where: { id } });
  forgetSiteContact();
  refresh();
}

export type PromotionFormState = { error?: string; ok?: number };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Uitgelichte webshop (zonder product) of uitgelicht product. Het product mag als id, als link
 * naar de productpagina op onze site (…/product/123) of als link naar de webshop worden opgegeven.
 */
export async function createPromotion(
  _prev: PromotionFormState,
  form: FormData,
): Promise<PromotionFormState> {
  await assertAdmin();
  const prisma = getPrisma();
  const startsOn = String(form.get("startsOn") ?? "").trim() || todayNL();
  const endsOn = String(form.get("endsOn") ?? "").trim() || null;
  if (!DAY_RE.test(startsOn) || (endsOn && !DAY_RE.test(endsOn)))
    return { error: "Vul geldige datums in." };
  if (endsOn && endsOn < startsOn)
    return { error: "De einddatum ligt vóór de startdatum." };
  const note = String(form.get("note") ?? "")
    .trim()
    .slice(0, 200);

  let shopId: number;
  let productId: bigint | null = null;
  const productInput = String(form.get("product") ?? "").trim();
  if (form.get("kind") === "product") {
    const product = await findProduct(productInput);
    if (!product) return { error: "Product niet gevonden." };
    shopId = product.shopId;
    productId = product.id;
  } else {
    const shop = await prisma.shop.findUnique({
      select: { id: true },
      where: { slug: String(form.get("shop") ?? "") },
    });
    if (!shop) return { error: "Kies een webshop." };
    shopId = shop.id;
  }

  await prisma.promotion.create({
    data: {
      shopId,
      productId,
      startsOn: dateOnly(startsOn),
      endsOn: endsOn ? dateOnly(endsOn) : null,
      note,
    },
  });
  forgetPromotions();
  refresh();
  return { ok: Date.now() };
}

async function findProduct(input: string) {
  if (!input) return null;
  const prisma = getPrisma();
  const select = { id: true, shopId: true } as const;
  const id = /^\d+$/.test(input)
    ? input
    : input.match(/\/product\/(\d+)(?:[/?#]|$)/)?.[1];
  if (id)
    return prisma.product.findUnique({ select, where: { id: BigInt(id) } });
  // Link naar de webshop: met en zonder query-string proberen.
  const url = input.split("#")[0];
  return prisma.product.findFirst({
    select,
    where: { url: { in: [url, url.split("?")[0]] } },
  });
}

export async function togglePromotion(id: number, enabled: boolean) {
  await assertAdmin();
  await getPrisma().promotion.updateMany({ where: { id }, data: { enabled } });
  forgetPromotions();
  refresh();
}

export async function deletePromotion(id: number) {
  await assertAdmin();
  await getPrisma().promotion.deleteMany({ where: { id } });
  forgetPromotions();
  refresh();
}
