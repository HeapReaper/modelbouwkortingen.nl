"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { NewsletterState } from "@/app/[lang]/nieuwsbrief/shared";
import {
  DEFAULT_LOCALE,
  hasLocale,
  type Locale,
  localePath,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/translate";
import {
  addToWatchlist,
  cancelAccountAlert,
  changePassword,
  confirmEmailChange,
  deleteAccount,
  getWatchlist,
  login,
  register,
  removeFromWatchlist,
  requestEmailChange,
  requestPasswordReset,
  resetPassword,
  setNewsletter,
  updateAlertTarget,
  verifyEmail,
} from "@/lib/account";
import { endSession, getCurrentUser, passwordProblem } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";

/** Server Actions kennen next/root-params niet: de taal komt mee als verborgen veld. */
function formLang(formData: FormData): Locale {
  const value = formData.get("lang");
  return hasLocale(value) ? value : DEFAULT_LOCALE;
}

const isEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;

// Eenvoudige rate limit per sleutel (IP of adres; in-memory, per serverproces).
const recent = new Map<string, number[]>();
function limited(key: string, max: number, windowMs = 10 * 60_000) {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return true;
  recent.set(key, [...hits, now]);
  return false;
}

async function clientIp() {
  return (
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "onbekend"
  );
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Niet ingelogd");
  return user;
}

export async function registerAccount(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const lang = formLang(formData);
  const a = getDictionary(lang).account;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  // Honeypot: bots vullen dit verborgen veld in.
  if (formData.get("website")) return { ok: true, message: a.registered };
  if (!isEmail(email)) return { ok: false, message: a.invalidEmail, email };
  const problem = passwordProblem(password);
  if (problem) return { ok: false, message: a[problem], email };
  if (password !== String(formData.get("password2") ?? ""))
    return { ok: false, message: a.passwordMismatch, email };
  if (limited(`register:${await clientIp()}`, 5))
    return { ok: false, message: a.rateLimited, email };
  if (!isDbConfigured()) return { ok: false, message: a.unavailable, email };
  try {
    await register(email, password, lang);
  } catch (err) {
    console.error("[account] registreren mislukt", err);
    return { ok: false, message: a.failed, email };
  }
  return { ok: true, message: a.registered };
}

export async function loginAccount(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const lang = formLang(formData);
  const a = getDictionary(lang).account;
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!isEmail(email) || !password)
    return { ok: false, message: a.loginInvalid, email };
  if (
    limited(`login:${await clientIp()}`, 20) ||
    limited(`login:${email.toLowerCase()}`, 10)
  )
    return { ok: false, message: a.rateLimited, email };
  if (!isDbConfigured()) return { ok: false, message: a.unavailable, email };
  let result: Awaited<ReturnType<typeof login>>;
  try {
    result = await login(email, password, lang);
  } catch (err) {
    console.error("[account] inloggen mislukt", err);
    return { ok: false, message: a.failed, email };
  }
  if (result === "invalid")
    return { ok: false, message: a.loginInvalid, email };
  if (result === "unverified")
    return { ok: false, message: a.loginUnverified, email };
  redirect(localePath(lang, "/account"));
}

export async function logoutAccount(formData: FormData) {
  await endSession();
  redirect(localePath(formLang(formData), "/account"));
}

/** Knop op de bevestigingspagina (niet bij openen: virusscanners openen links). */
export async function verifyAccount(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const lang = formLang(formData);
  const a = getDictionary(lang).account;
  const token = String(formData.get("token") ?? "");
  if (!token || !isDbConfigured() || !(await verifyEmail(token)))
    return { ok: false, message: a.verifyInvalid };
  redirect(`${localePath(lang, "/account")}?welkom=1`);
}

export async function requestReset(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const lang = formLang(formData);
  const a = getDictionary(lang).account;
  const email = String(formData.get("email") ?? "").trim();
  if (!isEmail(email)) return { ok: false, message: a.invalidEmail, email };
  if (limited(`reset:${await clientIp()}`, 5))
    return { ok: false, message: a.rateLimited, email };
  if (!isDbConfigured()) return { ok: false, message: a.unavailable, email };
  try {
    await requestPasswordReset(email, lang);
  } catch (err) {
    console.error("[account] herstellink mislukt", err);
    return { ok: false, message: a.failed, email };
  }
  return { ok: true, message: a.resetSent };
}

export async function resetAccountPassword(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const lang = formLang(formData);
  const a = getDictionary(lang).account;
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { ok: false, message: a[problem] };
  if (password !== String(formData.get("password2") ?? ""))
    return { ok: false, message: a.passwordMismatch };
  if (!token || !isDbConfigured() || !(await resetPassword(token, password)))
    return { ok: false, message: a.resetInvalid };
  redirect(localePath(lang, "/account"));
}

export async function changeAccountPassword(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const a = getDictionary(formLang(formData)).account;
  const user = await requireUser();
  const next = String(formData.get("password") ?? "");
  const problem = passwordProblem(next);
  if (problem) return { ok: false, message: a[problem] };
  if (next !== String(formData.get("password2") ?? ""))
    return { ok: false, message: a.passwordMismatch };
  if (limited(`password:${user.id}`, 10))
    return { ok: false, message: a.rateLimited };
  const current = String(formData.get("current") ?? "");
  if (!(await changePassword(user.id, current, next)))
    return { ok: false, message: a.currentPasswordWrong };
  return { ok: true, message: a.passwordChanged };
}

export async function changeAccountEmail(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const lang = formLang(formData);
  const a = getDictionary(lang).account;
  const user = await requireUser();
  const email = String(formData.get("email") ?? "").trim();
  if (!isEmail(email)) return { ok: false, message: a.invalidEmail, email };
  if (limited(`email:${user.id}`, 5))
    return { ok: false, message: a.rateLimited, email };
  let result: Awaited<ReturnType<typeof requestEmailChange>>;
  try {
    result = await requestEmailChange(
      user.id,
      String(formData.get("password") ?? ""),
      email,
      lang,
    );
  } catch (err) {
    console.error("[account] adreswijziging mislukt", err);
    return { ok: false, message: a.failed, email };
  }
  if (result === "wrongPassword")
    return { ok: false, message: a.currentPasswordWrong, email };
  if (result === "same") return { ok: false, message: a.emailSame, email };
  return { ok: true, message: t(a.emailSent, { email: email.toLowerCase() }) };
}

/** Knop op de pagina uit de mail naar het nieuwe adres. */
export async function confirmAccountEmail(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const lang = formLang(formData);
  const a = getDictionary(lang).account;
  const token = String(formData.get("token") ?? "");
  if (!token || !isDbConfigured())
    return { ok: false, message: a.emailChangeInvalid };
  const result = await confirmEmailChange(token, lang);
  if (result === "invalid") return { ok: false, message: a.emailChangeInvalid };
  if (result === "taken") return { ok: false, message: a.emailTaken };
  redirect(`${localePath(lang, "/account")}?email=1`);
}

export async function deleteOwnAccount(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const lang = formLang(formData);
  const a = getDictionary(lang).account;
  const user = await requireUser();
  if (limited(`delete:${user.id}`, 10))
    return { ok: false, message: a.rateLimited };
  if (!(await deleteAccount(user.id, String(formData.get("password") ?? ""))))
    return { ok: false, message: a.currentPasswordWrong };
  await endSession();
  redirect(`${localePath(lang, "/account")}?verwijderd=1`);
}

// ---------------------------------------------------------------- volglijst

/**
 * Eerste keer inloggen in deze browser: de lokale volglijst gaat naar het account. Geeft de
 * volledige lijst van het account terug.
 */
export async function mergeWatchlist(localIds: number[]): Promise<number[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  await addToWatchlist(user.id, Array.isArray(localIds) ? localIds : []);
  return getWatchlist(user.id);
}

export async function setWatchlistItem(productId: number, watched: boolean) {
  const user = await getCurrentUser();
  if (!user) return;
  if (watched) await addToWatchlist(user.id, [productId]);
  else await removeFromWatchlist(user.id, productId);
}

// ---------------------------------------------------------------- prijsalarmen

export async function updateAccountAlert(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const a = getDictionary(formLang(formData)).account;
  const user = await requireUser();
  const target =
    Math.round(
      Number(String(formData.get("target") ?? "").replace(",", ".")) * 100,
    ) / 100;
  if (!Number.isFinite(target) || target <= 0 || target > 1_000_000)
    return { ok: false, message: a.alertInvalidPrice };
  const ok = await updateAlertTarget(
    user.email,
    Number(formData.get("alert")),
    target,
  );
  if (ok) refresh();
  return ok
    ? { ok: true, message: a.alertSaved }
    : { ok: false, message: a.failed };
}

export async function cancelOwnAlert(alertId: number) {
  const user = await requireUser();
  await cancelAccountAlert(user.email, alertId);
  refresh();
}

// ---------------------------------------------------------------- kortingsmail

export async function setAccountNewsletter(subscribed: boolean, lang: string) {
  const user = await requireUser();
  await setNewsletter(
    user.email,
    subscribed,
    hasLocale(lang) ? lang : DEFAULT_LOCALE,
  );
  refresh();
}
