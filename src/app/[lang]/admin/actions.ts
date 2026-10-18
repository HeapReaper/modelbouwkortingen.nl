"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { isAuthorized } from "@/lib/admin-auth";
import { getPrisma, isDbConfigured } from "@/lib/db";
import {
  forgetSiteContact,
  normalizePhone,
  normalizeUrl,
} from "@/lib/site-contact";
import { isSocialPlatform } from "@/lib/social-platforms";

async function assertAdmin() {
  if (!isAuthorized((await headers()).get("authorization")))
    throw new Error("Niet ingelogd");
  if (!isDbConfigured()) throw new Error("Geen database");
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
