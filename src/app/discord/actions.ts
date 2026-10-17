"use server";

import { headers } from "next/headers";
import type { NewsletterState } from "@/app/nieuwsbrief/shared";
import { isDbConfigured } from "@/lib/db";
import { subscribeWebhook, unsubscribeWebhook } from "@/lib/discord";

// Eenvoudige rate limit per IP (in-memory, per serverproces).
const recent = new Map<string, number[]>();

export async function subscribeDiscord(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const webhook = String(formData.get("webhook") ?? "").trim();
  // Honeypot: bots vullen dit verborgen veld in.
  if (formData.get("website")) return { ok: true, message: "Gekoppeld!" };

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "onbekend";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (hits.length >= 5) {
    return {
      ok: false,
      message:
        "Je hebt al een paar webhooks opgegeven. Probeer het later opnieuw.",
      email: webhook,
    };
  }
  recent.set(ip, [...hits, now]);

  if (!isDbConfigured()) {
    return {
      ok: false,
      message: "Discord-meldingen zijn nu niet beschikbaar.",
    };
  }
  try {
    const result = await subscribeWebhook(webhook);
    if (!result.ok) return { ok: false, message: result.error, email: webhook };
    return {
      ok: true,
      message: `Gekoppeld${result.name ? ` aan "${result.name}"` : ""}! Er staat een welkomstbericht in je kanaal; nieuwe deals verschijnen daar vanzelf.`,
    };
  } catch (err) {
    console.error("[discord] aanmelden mislukt", err);
    return {
      ok: false,
      message: "Er ging iets mis bij het koppelen. Probeer het later opnieuw.",
      email: webhook,
    };
  }
}

export async function unsubscribeDiscord(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const token = String(formData.get("token") ?? "");
  if (!token || !isDbConfigured() || !(await unsubscribeWebhook(token))) {
    return {
      ok: false,
      message: "Deze afmeldlink is onbekend of al gebruikt.",
    };
  }
  return {
    ok: true,
    message: "Afgemeld: we posten geen deals meer in dit kanaal.",
  };
}
