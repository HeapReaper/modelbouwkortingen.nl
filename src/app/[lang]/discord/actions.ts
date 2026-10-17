"use server";

import { headers } from "next/headers";
import type { NewsletterState } from "@/app/[lang]/nieuwsbrief/shared";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/translate";
import { isDbConfigured } from "@/lib/db";
import {
  saveWebhookPreferences,
  subscribeWebhook,
  unsubscribeWebhook,
} from "@/lib/discord";
import { parsePreferences } from "@/lib/preferences";

// Eenvoudige rate limit per IP (in-memory, per serverproces).
const recent = new Map<string, number[]>();

/** Server Actions kennen next/root-params niet: de taal komt mee als verborgen veld. */
function formLang(formData: FormData): Locale {
  const value = formData.get("lang");
  return hasLocale(value) ? value : DEFAULT_LOCALE;
}

export async function subscribeDiscord(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const lang = formLang(formData);
  const d = getDictionary(lang).discord;
  const webhook = String(formData.get("webhook") ?? "").trim();
  // Honeypot: bots vullen dit verborgen veld in.
  if (formData.get("website")) return { ok: true, message: d.linked };

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "onbekend";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (hits.length >= 5) {
    return { ok: false, message: d.rateLimited, email: webhook };
  }
  recent.set(ip, [...hits, now]);

  if (!isDbConfigured()) {
    return { ok: false, message: d.unavailable };
  }
  try {
    const result = await subscribeWebhook(webhook, lang);
    if (!result.ok) {
      return { ok: false, message: d[result.error], email: webhook };
    }
    return {
      ok: true,
      message: result.name ? t(d.linkedNamed, { name: result.name }) : d.linked,
    };
  } catch (err) {
    console.error("[discord] aanmelden mislukt", err);
    return { ok: false, message: d.failed, email: webhook };
  }
}

export async function unsubscribeDiscord(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const d = getDictionary(formLang(formData)).discord;
  const token = String(formData.get("token") ?? "");
  if (!token || !isDbConfigured() || !(await unsubscribeWebhook(token))) {
    return { ok: false, message: d.unsubscribeInvalid };
  }
  return { ok: true, message: d.unsubscribeOk };
}

export async function saveDiscordPreferences(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const p = getDictionary(formLang(formData)).preferences;
  const token = String(formData.get("token") ?? "");
  const prefs = parsePreferences(formData);
  if (
    !token ||
    !isDbConfigured() ||
    !(await saveWebhookPreferences(token, prefs))
  ) {
    return { ok: false, message: p.invalid };
  }
  return { ok: true, message: p.saved };
}
