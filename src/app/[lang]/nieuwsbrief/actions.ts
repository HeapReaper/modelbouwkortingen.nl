"use server";

import { headers } from "next/headers";
import type { NewsletterState } from "@/app/[lang]/nieuwsbrief/shared";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isDbConfigured } from "@/lib/db";
import {
  confirm,
  savePreferences,
  subscribe,
  unsubscribe,
} from "@/lib/newsletter";
import { parsePreferences } from "@/lib/preferences";

// Eenvoudige rate limit per IP (in-memory, per serverproces).
const recent = new Map<string, number[]>();

/** Server Actions kennen next/root-params niet: de taal komt mee als verborgen veld. */
function formLang(formData: FormData): Locale {
  const value = formData.get("lang");
  return hasLocale(value) ? value : DEFAULT_LOCALE;
}

export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const lang = formLang(formData);
  const n = getDictionary(lang).newsletter;
  const email = String(formData.get("email") ?? "").trim();
  // Honeypot: bots vullen dit verborgen veld in.
  if (formData.get("website")) return { ok: true, message: n.subscribed };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return { ok: false, message: n.invalidEmail, email };
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "onbekend";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (hits.length >= 5) {
    return { ok: false, message: n.rateLimited, email };
  }
  recent.set(ip, [...hits, now]);

  if (!isDbConfigured()) {
    console.info("[nieuwsbrief] (geen database ingesteld)", email);
    return { ok: true, message: n.subscribed };
  }
  try {
    await subscribe(email, lang);
  } catch (err) {
    console.error("[nieuwsbrief] aanmelden mislukt", err);
    return { ok: false, message: n.failed, email };
  }
  return { ok: true, message: n.subscribed };
}

export async function confirmNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const n = getDictionary(formLang(formData)).newsletter;
  const token = String(formData.get("token") ?? "");
  if (!token || !isDbConfigured() || !(await confirm(token))) {
    return { ok: false, message: n.confirmInvalid };
  }
  return { ok: true, message: n.confirmOk };
}

export async function unsubscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const n = getDictionary(formLang(formData)).newsletter;
  const token = String(formData.get("token") ?? "");
  if (!token || !isDbConfigured() || !(await unsubscribe(token))) {
    return { ok: false, message: n.unsubscribeInvalid };
  }
  return { ok: true, message: n.unsubscribeOk };
}

export async function saveNewsletterPreferences(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const p = getDictionary(formLang(formData)).preferences;
  const token = String(formData.get("token") ?? "");
  const prefs = parsePreferences(formData);
  if (!token || !isDbConfigured() || !(await savePreferences(token, prefs))) {
    return { ok: false, message: p.invalid };
  }
  return { ok: true, message: p.saved };
}
