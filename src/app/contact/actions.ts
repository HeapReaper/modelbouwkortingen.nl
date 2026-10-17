"use server";

import { headers } from "next/headers";
import { type ContactState, SUBJECTS } from "@/app/contact/shared";
import { getPrisma, isDbConfigured } from "@/lib/db";

// Eenvoudige rate limit per IP (in-memory, per serverproces).
const recent = new Map<string, number[]>();

export async function sendContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const values = {
    name: get("name"),
    email: get("email"),
    subject: get("subject"),
    message: get("message"),
  };

  // Honeypot: bots vullen dit verborgen veld in.
  if (get("website")) return { ok: true, message: "Bedankt voor je bericht!" };

  const errors: ContactState["errors"] = {};
  if (values.name.length < 2 || values.name.length > 100)
    errors.name = "Vul je naam in.";
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ||
    values.email.length > 200
  )
    errors.email = "Vul een geldig e-mailadres in.";
  if (!SUBJECTS.includes(values.subject as (typeof SUBJECTS)[number]))
    errors.subject = "Kies een onderwerp.";
  if (values.message.length < 10)
    errors.message = "Je bericht is wat kort (minimaal 10 tekens).";
  if (values.message.length > 5000)
    errors.message = "Je bericht is te lang (maximaal 5000 tekens).";
  if (Object.keys(errors).length > 0) return { ok: false, errors, values };

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "onbekend";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (hits.length >= 5) {
    return {
      ok: false,
      message:
        "Je hebt al een paar berichten gestuurd. Probeer het later opnieuw.",
      values,
    };
  }
  recent.set(ip, [...hits, now]);

  if (!isDbConfigured()) {
    console.info("[contact] (geen database ingesteld)", values);
    return { ok: true, message: "Bedankt! Je bericht is ontvangen." };
  }
  try {
    await getPrisma().contactMessage.create({
      data: {
        name: values.name,
        email: values.email,
        subject: values.subject,
        message: values.message,
      },
    });
  } catch (err) {
    console.error("[contact] opslaan mislukt", err);
    return {
      ok: false,
      message: "Er ging iets mis bij het versturen. Probeer het later opnieuw.",
      values,
    };
  }
  return {
    ok: true,
    message: "Bedankt! We reageren meestal binnen een paar dagen.",
  };
}
