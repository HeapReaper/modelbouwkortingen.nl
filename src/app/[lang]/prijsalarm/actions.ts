"use server";

import { headers } from "next/headers";
import type { NewsletterState } from "@/app/[lang]/nieuwsbrief/shared";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentUser } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";
import { cancelAlert, confirmAlert, createAlert } from "@/lib/price-alerts";

// Eenvoudige rate limit per IP (in-memory, per serverproces).
const recent = new Map<string, number[]>();

/** Server Actions kennen next/root-params niet: de taal komt mee als verborgen veld. */
function formLang(formData: FormData): Locale {
  const value = formData.get("lang");
  return hasLocale(value) ? value : DEFAULT_LOCALE;
}

export async function createPriceAlert(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const lang = formLang(formData);
  const a = getDictionary(lang).priceAlert;
  const email = String(formData.get("email") ?? "").trim();
  // Honeypot: bots vullen dit verborgen veld in.
  if (formData.get("website")) return { ok: true, message: a.created };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return { ok: false, message: a.invalidEmail, email };
  }
  const productId = Number(formData.get("product"));
  const target =
    Math.round(
      Number(String(formData.get("target") ?? "").replace(",", ".")) * 100,
    ) / 100;
  if (!Number.isFinite(target) || target <= 0 || target > 1_000_000) {
    return { ok: false, message: a.invalidPrice, email };
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "onbekend";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (hits.length >= 10) {
    return { ok: false, message: a.rateLimited, email };
  }
  recent.set(ip, [...hits, now]);

  if (!isDbConfigured()) {
    return { ok: false, message: a.unavailable, email };
  }
  // Ingelogd met hetzelfde adres: dat is al bevestigd, dus geen bevestigingsmail.
  const user = await getCurrentUser();
  const confirmed = user?.email === email.toLowerCase();
  try {
    const result = await createAlert(email, productId, target, lang, {
      confirmed,
    });
    if (!result.ok) return { ok: false, message: a[result.error], email };
  } catch (err) {
    console.error("[prijsalarm] aanmaken mislukt", err);
    return { ok: false, message: a.failed, email };
  }
  return { ok: true, message: confirmed ? a.createdAccount : a.created };
}

export async function confirmPriceAlert(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const a = getDictionary(formLang(formData)).priceAlert;
  const token = String(formData.get("token") ?? "");
  if (!token || !isDbConfigured() || !(await confirmAlert(token))) {
    return { ok: false, message: a.confirmInvalid };
  }
  return { ok: true, message: a.confirmOk };
}

export async function cancelPriceAlert(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const a = getDictionary(formLang(formData)).priceAlert;
  const token = String(formData.get("token") ?? "");
  if (!token || !isDbConfigured() || !(await cancelAlert(token))) {
    return { ok: false, message: a.cancelInvalid };
  }
  return { ok: true, message: a.cancelOk };
}
