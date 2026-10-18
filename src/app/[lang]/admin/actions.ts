"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import {
  type CrawlerLogFilter,
  type CrawlerLogs,
  getCrawlerLogs,
} from "@/lib/admin";
import { isAuthorized } from "@/lib/admin-auth";
import { getPrisma, isDbConfigured } from "@/lib/db";
import { sendMail } from "@/lib/mail";
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
