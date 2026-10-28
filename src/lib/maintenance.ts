import "server-only";

import { createHash } from "node:crypto";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { cached, forget } from "@/lib/cache";
import { getPrisma, isDbConfigured } from "@/lib/db";

/**
 * Onderhoudsmodus, aan/uit in het adminpanel. De proxy toont bezoekers dan een 503-pagina;
 * /admin, de API-routes en de admin zelf (cookie, gezet bij het inloggen op /admin) niet.
 * Met Redis (REDIS_URL) delen de proxy en de pagina's de cache en is een wijziging meteen overal
 * zichtbaar; zonder Redis heeft de proxy een eigen kopie en duurt dat hooguit CACHE_MS.
 */

export type Maintenance = { enabled: boolean; message: string };

const OFF: Maintenance = { enabled: false, message: "" };
const CACHE_KEY = "maintenance";
const CACHE_MS = 10_000;

export const MAINTENANCE_BYPASS_COOKIE = "mbk_maintenance_bypass";

/** Bij een databasefout staat de site gewoon aan: liever geen onderhoudspagina door een storing. */
export async function getMaintenance(): Promise<Maintenance> {
  if (!isDbConfigured()) return OFF;
  try {
    return await cached(CACHE_KEY, CACHE_MS, async () => {
      const row = await getPrisma().siteSetting.findUnique({
        where: { id: 1 },
      });
      return row
        ? { enabled: row.maintenance, message: row.maintenanceMessage }
        : OFF;
    });
  } catch (err) {
    console.error("[onderhoud] laden mislukt", err);
    return OFF;
  }
}

export async function setMaintenance(enabled: boolean, message: string) {
  await getPrisma().siteSetting.upsert({
    where: { id: 1 },
    create: { id: 1, maintenance: enabled, maintenanceMessage: message },
    update: { maintenance: enabled, maintenanceMessage: message },
  });
  forget(CACHE_KEY);
}

/** Afgeleid van de admin-login: verandert het wachtwoord, dan vervalt de cookie vanzelf. */
export function maintenanceBypassToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  const user = process.env.ADMIN_USER || "admin";
  return createHash("sha256")
    .update(`maintenance-bypass:${user}:${password}`)
    .digest("hex");
}

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] ?? c,
  );

/** Losse HTML-pagina (geen React): de proxy geeft die direct terug, ook als de app hapert. */
export function maintenancePage(lang: Locale, message: string): string {
  const d = getDictionary(lang).maintenance;
  const extra = message
    ? `<p class="msg">${escapeHtml(message).replace(/\n/g, "<br>")}</p>`
    : "";
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(d.title)} — Modelbouwkortingen.nl</title>
<style>
  :root { color-scheme: light dark; --bg: #f8fafc; --card: #fff; --fg: #0f172a; --muted: #64748b; --border: #e2e8f0; --accent: #dc2626; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0b0f17; --card: #111827; --fg: #f1f5f9; --muted: #94a3b8; --border: #1f2937; } }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; box-sizing: border-box; background: var(--bg); color: var(--fg); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 32rem; width: 100%; background: var(--card); border: 1px solid var(--border); border-radius: 1rem; padding: 2rem; text-align: center; }
  .brand { font-weight: 900; color: var(--accent); margin: 0 0 1rem; }
  h1 { font-size: 1.5rem; font-weight: 900; margin: 0 0 .5rem; }
  p { margin: 0; color: var(--muted); }
  .msg { margin-top: 1rem; color: var(--fg); }
</style>
</head>
<body>
<main>
  <p class="brand">Modelbouwkortingen.nl</p>
  <h1>${escapeHtml(d.title)}</h1>
  <p>${escapeHtml(d.body)}</p>
  ${extra}
</main>
</body>
</html>`;
}
