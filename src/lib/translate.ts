import "server-only";

import { headers } from "next/headers";
import type { Locale } from "@/i18n/config";
import { isBot } from "@/lib/bots";
import { getPrisma, isDbConfigured, num } from "@/lib/db";
import {
  SHOP_LANGUAGES,
  type SourceLanguage,
  TRANSLATED_SHOPS,
} from "@/lib/shops";

/**
 * Vertaalt de productnamen van Duitse en Franse webshops (zie `language` in src/lib/shops.ts)
 * naar de taal van de bezoeker, of bij mail en Discord naar de taal waarin de abonnee zich aanmeldde.
 * Vertalingen komen van LibreTranslate, een eigen container (LIBRETRANSLATE_URL, zie
 * docker-compose.yml), en staan in product_translations: elke naam wordt één keer per taal
 * vertaald. De planner vertaalt nieuwe deals vooraf (translatePendingDeals), de rest (volglijst,
 * prijsvergelijker, ...) wordt bij het eerste bekijken vertaald.
 *
 * Bots (zoekmachines, linkvoorbeelden, scrapers; zie src/lib/bots.ts) krijgen alleen bewaarde
 * vertalingen en anders de originele naam; ze laten nooit iets nieuws vertalen, zodat ze de
 * vertaalcontainer niet bezig houden.
 */

/**
 * Doeltalen met hun LibreTranslate-code. Een naam wordt niet naar zijn eigen taal vertaald:
 * Duitse bezoekers zien de originele naam van een Duitse webshop.
 */
const TARGETS = { nl: "nl", en: "en", de: "de" } as const;
type Target = keyof typeof TARGETS;

/** Zoveel namen per verzoek aan LibreTranslate (en per keer opslaan). */
const BATCH = 50;
/** Zo lang wacht een pagina hooguit op een nieuwe vertaling; daarna de originele naam. */
const PAGE_WAIT_MS = 2_000;
/** Ruim: LibreTranslate vertaalt op de CPU, een volle batch kan even duren. */
const REQUEST_TIMEOUT_MS = 60_000;

type Localizable = {
  id: number;
  name: string;
  shopSlug: string;
  originalName?: string;
};

export function isTranslatorConfigured() {
  return Boolean(process.env.LIBRETRANSLATE_URL);
}

function isTarget(lang: Locale): lang is Target {
  return lang in TARGETS;
}

/** Vertaalt alle teksten in één verzoek, of gooit bij een fout. */
async function libreTranslate(
  texts: string[],
  source: SourceLanguage,
  target: Target,
): Promise<string[]> {
  const base = (process.env.LIBRETRANSLATE_URL ?? "").replace(/\/+$/, "");
  const res = await fetch(`${base}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: texts,
      source,
      target: TARGETS[target],
      format: "text",
      // Alleen nodig bij een LibreTranslate-server die API-sleutels vereist.
      ...(process.env.LIBRETRANSLATE_API_KEY
        ? { api_key: process.env.LIBRETRANSLATE_API_KEY }
        : {}),
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => null)) as {
    translatedText?: string[];
    error?: string;
  } | null;
  if (!res.ok || !Array.isArray(body?.translatedText)) {
    throw new Error(
      `LibreTranslate ${res.status}: ${body?.error ?? res.statusText}`,
    );
  }
  return body.translatedText.map((t) => (t ?? "").trim());
}

/** Voor het adminpanel: vertaalt één woord om te zien of de dienst werkt. */
export async function checkTranslator(): Promise<string> {
  const [text] = await libreTranslate(["Test"], "de", "nl");
  return text;
}

/** Hooguit één foutmelding per minuut in de log (bv. bij een verkeerde sleutel). */
let lastErrorLog = 0;
function logError(err: unknown) {
  if (Date.now() - lastErrorLog < 60_000) return;
  lastErrorLog = Date.now();
  console.error("[vertalen] LibreTranslate mislukt", err);
}

/** Vertaalt en bewaart; geeft id → vertaalde naam van wat gelukt is. */
async function translateAndStore(
  items: { id: number; name: string }[],
  source: SourceLanguage,
  target: Target,
): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  const prisma = getPrisma();
  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH);
    try {
      const names = await libreTranslate(
        chunk.map((c) => c.name),
        source,
        target,
      );
      await prisma.$transaction(
        chunk.map((c, j) => {
          const data = { name: names[j] || c.name, sourceName: c.name };
          return prisma.productTranslation.upsert({
            where: {
              productId_locale: { productId: BigInt(c.id), locale: target },
            },
            create: { productId: BigInt(c.id), locale: target, ...data },
            update: { ...data, createdAt: new Date() },
          });
        }),
      );
      chunk.forEach((c, j) => {
        out.set(c.id, names[j] || c.name);
      });
    } catch (err) {
      logError(err);
      break;
    }
  }
  return out;
}

/**
 * Lopende vertalingen, zodat gelijktijdige pagina's dezelfde naam niet allemaal apart naar
 * LibreTranslate sturen.
 */
const inflight = new Map<string, Promise<string | null>>();

function translate(
  items: { id: number; name: string }[],
  source: SourceLanguage,
  target: Target,
): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  const waits: Promise<unknown>[] = [];
  const todo: { id: number; name: string }[] = [];
  const keyOf = (item: { id: number; name: string }) =>
    `${target}:${item.id}:${item.name}`;
  for (const item of items) {
    const pending = inflight.get(keyOf(item));
    if (pending) {
      waits.push(pending.then((name) => name && result.set(item.id, name)));
    } else {
      todo.push(item);
    }
  }
  if (todo.length > 0) {
    const run = translateAndStore(todo, source, target);
    for (const item of todo) {
      const key = keyOf(item);
      const one = run
        .then(
          (names) => names.get(item.id) ?? null,
          () => null,
        )
        .finally(() => inflight.delete(key));
      inflight.set(key, one);
      waits.push(one.then((name) => name && result.set(item.id, name)));
    }
  }
  return Promise.all(waits).then(() => result);
}

/**
 * Zet de namen van producten van Duitse en Franse webshops in de gevraagde taal
 * (`originalName` = de originele naam). Ontbrekende vertalingen worden direct opgehaald;
 * duurt dat langer dan `waitMs`, dan blijft deze keer de originele naam staan en wordt de
 * vertaling op de achtergrond bewaard voor de volgende keer. Zonder LIBRETRANSLATE_URL: alleen
 * bewaarde vertalingen.
 */
export async function localizeDeals<T extends Localizable>(
  items: T[],
  lang: Locale,
  opts: { waitMs?: number; background?: boolean } = {},
): Promise<T[]> {
  if (!isTarget(lang) || !isDbConfigured()) return items;
  const foreign = items.filter((i) => {
    const source = SHOP_LANGUAGES.get(i.shopSlug);
    return source !== undefined && source !== lang;
  });
  if (foreign.length === 0) return items;

  const rows = await getPrisma().productTranslation.findMany({
    where: {
      locale: lang,
      productId: { in: [...new Set(foreign.map((i) => BigInt(i.id)))] },
    },
    select: { productId: true, name: true, sourceName: true },
  });
  const stored = new Map(rows.map((r) => [num(r.productId), r]));
  const names = new Map<number, string>();
  const missing = new Map<
    SourceLanguage,
    Map<number, { id: number; name: string }>
  >();
  for (const item of foreign) {
    const row = stored.get(item.id);
    if (row && row.sourceName === item.name) {
      names.set(item.id, row.name);
      continue;
    }
    const source = SHOP_LANGUAGES.get(item.shopSlug);
    if (!source) continue;
    const todo = missing.get(source) ?? new Map();
    todo.set(item.id, { id: item.id, name: item.name });
    missing.set(source, todo);
  }

  if (
    missing.size > 0 &&
    isTranslatorConfigured() &&
    (opts.background || !(await fromBot()))
  ) {
    const fresh = await Promise.race([
      Promise.all(
        [...missing].map(([source, todo]) =>
          translate([...todo.values()], source, lang),
        ),
      ),
      new Promise<Map<number, string>[]>((resolve) =>
        setTimeout(() => resolve([]), opts.waitMs ?? PAGE_WAIT_MS),
      ),
    ]);
    for (const done of fresh) {
      for (const [id, name] of done) names.set(id, name);
    }
  }

  return items.map((item) => {
    const name = names.get(item.id);
    return name && name !== item.name
      ? { ...item, name, originalName: item.name }
      : item;
  });
}

/**
 * Komt dit verzoek van een bot? Buiten een verzoek (geen headers) gaan we daarvan uit; mail,
 * Discord en de planner geven daarom `background` mee.
 */
async function fromBot() {
  try {
    return isBot((await headers()).get("user-agent"));
  } catch {
    return true;
  }
}

/**
 * Voor mail, Discord en prijsalarmen: geen haast, liever vertaald dan snel. Draait vanuit de
 * planner (user-agent "node"), dus niet als bot behandelen.
 */
export const BACKGROUND = {
  waitMs: REQUEST_TIMEOUT_MS,
  background: true,
} as const;

/**
 * Vertaalt lopende deals van Duitse en Franse webshops die nog geen (actuele) vertaling
 * hebben, nieuwste eerst. Wordt elke paar minuten aangeroepen door de planner in instrumentation.ts.
 */
export async function translatePendingDeals(
  limit = 500,
): Promise<
  | { status: "not-configured" }
  | { status: "ok"; translated: number; failed: number }
> {
  if (!isTranslatorConfigured() || TRANSLATED_SHOPS.length === 0) {
    return { status: "not-configured" };
  }
  const prisma = getPrisma();
  let translated = 0;
  let failed = 0;
  const sources = [...new Set(SHOP_LANGUAGES.values())];
  for (const target of Object.keys(TARGETS) as Target[]) {
    for (const source of sources) {
      if (source === target) continue;
      const slugs = TRANSLATED_SHOPS.filter(
        (slug) => SHOP_LANGUAGES.get(slug) === source,
      );
      const rows = await prisma.$queryRaw<{ id: bigint; name: string }[]>`
        SELECT p.id, p.name
        FROM products p
        JOIN shops s ON s.id = p.shop_id
        LEFT JOIN product_translations t ON t.product_id = p.id AND t.locale = ${target}
        WHERE p.is_deal AND NOT p.hidden AND s.enabled AND s.slug = ANY(${slugs})
          AND (t.product_id IS NULL OR t.source_name <> p.name)
        ORDER BY p.deal_since DESC NULLS LAST, p.id DESC
        LIMIT ${limit}`;
      if (rows.length === 0) continue;
      const done = await translate(
        rows.map((r) => ({ id: num(r.id), name: r.name })),
        source,
        target,
      );
      translated += done.size;
      failed += rows.length - done.size;
    }
  }
  if (translated > 0) {
    console.info(`[vertalen] ${translated} productnamen vertaald`);
  }
  return { status: "ok", translated, failed };
}
