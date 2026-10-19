import { after } from "next/server";
import { splitLocale } from "@/i18n/config";
import { deviceType, recordPageView } from "@/lib/analytics";
import { isBot } from "@/lib/bots";
import { isDbConfigured } from "@/lib/db";

/**
 * Paginaweergave, gestuurd door PageViewTracker (navigator.sendBeacon) na het laden van een pagina
 * of een navigatie binnen de site. Bots tellen niet mee:
 *   - bots zonder JavaScript komen hier nooit (de meeste crawlers);
 *   - de tracker zelf slaat geautomatiseerde browsers over (navigator.webdriver);
 *   - hier: bekende bot-user-agents, verzoeken zonder Accept-Language of van een andere site, en
 *     meer dan RATE_LIMIT weergaven per IP in 10 minuten.
 * Antwoordt altijd 204, zodat een bot niet ziet of hij geteld is.
 */
export async function POST(request: Request) {
  const done = new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
  if (!isDbConfigured()) return done;

  const h = request.headers;
  const ua = h.get("user-agent") ?? "";
  const site = h.get("sec-fetch-site");
  if (isBot(ua) || !h.get("accept-language")) return done;
  if (site && site !== "same-origin") return done;

  let body: { p?: unknown; r?: unknown; e?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return done;
  }
  if (
    typeof body.p !== "string" ||
    !body.p.startsWith("/") ||
    body.p.length > 300
  ) {
    return done;
  }
  const { lang, path } = splitLocale(body.p);
  if (path === "/admin" || path.startsWith("/admin/")) return done;

  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "onbekend";
  if (overLimit(ip)) return done;

  const referrer =
    typeof body.r === "string"
      ? body.r
          .toLowerCase()
          .replace(/^www\./, "")
          .replace(/[^a-z0-9._-]/g, "")
          .slice(0, 100) || null
      : null;

  after(async () => {
    try {
      await recordPageView({
        path: path.length > 1 ? path.replace(/\/+$/, "") : path,
        lang,
        referrer,
        entry: body.e === true,
        device: deviceType(ua),
        ip,
        userAgent: ua,
      });
    } catch (err) {
      console.error("[statistieken] opslaan mislukt", err);
    }
  });
  return done;
}

/** Meer weergaven per IP in 10 minuten is een script, geen mens. */
const RATE_LIMIT = 120;
const recent = new Map<string, number[]>();

function overLimit(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  hits.push(now);
  recent.set(ip, hits.slice(-RATE_LIMIT - 1));
  if (recent.size > 10_000) {
    for (const [k, v] of recent) {
      if (now - (v.at(-1) ?? 0) > 10 * 60_000) recent.delete(k);
    }
  }
  return hits.length > RATE_LIMIT;
}
