"use server";

import { headers } from "next/headers";
import { type ContactState, SUBJECTS } from "@/app/[lang]/contact/shared";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPrisma, isDbConfigured } from "@/lib/db";

// Eenvoudige rate limit per IP (in-memory, per serverproces).
const recent = new Map<string, number[]>();

export async function sendContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const langValue = get("lang");
  const lang = hasLocale(langValue) ? langValue : DEFAULT_LOCALE;
  const c = getDictionary(lang).contact;
  const values = {
    name: get("name"),
    email: get("email"),
    subject: get("subject"),
    message: get("message"),
  };

  // Honeypot: bots vullen dit verborgen veld in.
  if (get("website")) return { ok: true, message: c.thanks };

  const errors: ContactState["errors"] = {};
  if (values.name.length < 2 || values.name.length > 100)
    errors.name = c.errors.name;
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ||
    values.email.length > 200
  )
    errors.email = c.errors.email;
  if (!SUBJECTS.includes(values.subject as (typeof SUBJECTS)[number]))
    errors.subject = c.errors.subject;
  if (values.message.length < 10) errors.message = c.errors.messageShort;
  if (values.message.length > 5000) errors.message = c.errors.messageLong;
  if (Object.keys(errors).length > 0) return { ok: false, errors, values };

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "onbekend";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (hits.length >= 5) {
    return {
      ok: false,
      message: c.errors.rateLimited,
      values,
    };
  }
  recent.set(ip, [...hits, now]);

  if (!isDbConfigured()) {
    console.info("[contact] (geen database ingesteld)", values);
    return { ok: true, message: c.thanksReceived };
  }
  try {
    await getPrisma().contactMessage.create({
      data: {
        name: values.name,
        email: values.email,
        // Het Nederlandse label, zodat het admin panel leesbaar blijft.
        subject:
          getDictionary(DEFAULT_LOCALE).contact.subjects[
            values.subject as (typeof SUBJECTS)[number]
          ],
        message: values.message,
      },
    });
  } catch (err) {
    console.error("[contact] opslaan mislukt", err);
    return {
      ok: false,
      message: c.errors.failed,
      values,
    };
  }
  return {
    ok: true,
    message: c.thanksReply,
  };
}
