"use server";

import { headers } from "next/headers";
import type { NewsletterState } from "@/app/nieuwsbrief/shared";
import { isDbConfigured } from "@/lib/db";
import { confirm, subscribe, unsubscribe } from "@/lib/newsletter";

// Eenvoudige rate limit per IP (in-memory, per serverproces).
const recent = new Map<string, number[]>();

const SUBSCRIBED =
  "Check je inbox en klik op de bevestigingslink. Ben je al aangemeld? Dan hoef je niets te doen.";

export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "").trim();
  // Honeypot: bots vullen dit verborgen veld in.
  if (formData.get("website")) return { ok: true, message: SUBSCRIBED };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return { ok: false, message: "Vul een geldig e-mailadres in.", email };
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "onbekend";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (hits.length >= 5) {
    return {
      ok: false,
      message:
        "Je hebt je al een paar keer aangemeld. Probeer het later opnieuw.",
      email,
    };
  }
  recent.set(ip, [...hits, now]);

  if (!isDbConfigured()) {
    console.info("[nieuwsbrief] (geen database ingesteld)", email);
    return { ok: true, message: SUBSCRIBED };
  }
  try {
    await subscribe(email);
  } catch (err) {
    console.error("[nieuwsbrief] aanmelden mislukt", err);
    return {
      ok: false,
      message: "Er ging iets mis bij het aanmelden. Probeer het later opnieuw.",
      email,
    };
  }
  return { ok: true, message: SUBSCRIBED };
}

export async function confirmNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const token = String(formData.get("token") ?? "");
  if (!token || !isDbConfigured() || !(await confirm(token))) {
    return {
      ok: false,
      message:
        "Deze link werkt niet (meer). Meld je opnieuw aan, dan sturen we een nieuwe.",
    };
  }
  return {
    ok: true,
    message:
      "Je aanmelding is bevestigd. Morgenochtend krijg je de eerste deals!",
  };
}

export async function unsubscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const token = String(formData.get("token") ?? "");
  if (!token || !isDbConfigured() || !(await unsubscribe(token))) {
    return { ok: false, message: "Deze afmeldlink is onbekend." };
  }
  return {
    ok: true,
    message: "Je bent afgemeld en krijgt geen kortingsmails meer.",
  };
}
