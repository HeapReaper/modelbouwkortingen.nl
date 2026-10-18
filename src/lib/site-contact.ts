import "server-only";

import { connection } from "next/server";
import { cached, forget, getPrisma, isDbConfigured } from "@/lib/db";
import { isSocialPlatform, type SocialPlatform } from "@/lib/social-platforms";

/**
 * Telefoonnummers (rode balk bovenaan) en social-mediapagina's (footer), beheerd in het
 * adminpanel. De site toont alleen de regels die aanstaan.
 */

export type PhoneNumber = {
  id: number;
  label: string;
  number: string;
  enabled: boolean;
};

export type SocialLink = {
  id: number;
  platform: SocialPlatform;
  url: string;
  enabled: boolean;
};

const CACHE_KEY = "site-contact";
const CACHE_MS = 5 * 60_000;

type SiteContact = { phones: PhoneNumber[]; socials: SocialLink[] };
const EMPTY: SiteContact = { phones: [], socials: [] };

/**
 * Alle regels, ook de uitgeschakelde (voor het adminpanel); null als de database niet
 * bereikbaar is. connection() staat bewust buiten de try: tijdens het prerenderen gooit die
 * een signaal dat Next zelf moet afhandelen.
 */
export async function getSiteContact(): Promise<SiteContact | null> {
  await connection();
  if (!isDbConfigured()) return EMPTY;
  try {
    return await loadSiteContact();
  } catch (err) {
    console.error("[contact] laden mislukt", err);
    return null;
  }
}

function loadSiteContact(): Promise<SiteContact> {
  return cached(CACHE_KEY, CACHE_MS, async () => {
    const prisma = getPrisma();
    const [phones, socials] = await Promise.all([
      prisma.phoneNumber.findMany({ orderBy: { id: "asc" } }),
      prisma.socialLink.findMany({ orderBy: { id: "asc" } }),
    ]);
    return {
      phones: phones.map(({ id, label, number, enabled }) => ({
        id,
        label,
        number,
        enabled,
      })),
      socials: socials.flatMap(({ id, platform, url, enabled }) =>
        isSocialPlatform(platform) ? [{ id, platform, url, enabled }] : [],
      ),
    };
  });
}

/** Alleen wat aanstaat; een databasefout mag de rest van de pagina niet breken. */
export async function getPublicSiteContact(): Promise<SiteContact> {
  const { phones, socials } = (await getSiteContact()) ?? EMPTY;
  return {
    phones: phones.filter((p) => p.enabled),
    socials: socials.filter((s) => s.enabled),
  };
}

export function forgetSiteContact() {
  forget(CACHE_KEY);
}

/** "+31 6 11103563" → "tel:+31611103563"; "06-11103563" → "tel:0611103563". */
export function telHref(number: string) {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

/** Alleen cijfers, spaties, +, -, haakjes en punten; minstens 6 cijfers. */
export function normalizePhone(input: string): string | null {
  const number = input.trim().replace(/\s+/g, " ");
  if (!/^\+?[\d\s\-().]+$/.test(number)) return null;
  const digits = number.replace(/\D/g, "").length;
  return digits >= 6 && digits <= 15 ? number : null;
}

/** Alleen http(s)-links; zonder schema zetten we er https:// voor. */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}
