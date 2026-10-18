import "server-only";

import {
  TranslateClient,
  TranslateTextCommand,
} from "@aws-sdk/client-translate";
import { headers } from "next/headers";
import type { Locale } from "@/i18n/config";
import { isBot } from "@/lib/bots";
import { getPrisma, isDbConfigured, num } from "@/lib/db";
import { GERMAN_SHOPS } from "@/lib/shops";

/**
 * Vertaalt de productnamen van Duitstalige webshops (zie `language` in src/lib/shops.ts) naar
 * de taal van de bezoeker, of bij mail en Discord naar de taal waarin de abonnee zich aanmeldde.
 * Vertalingen komen van Amazon Translate (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
 * en staan in product_translations: elke naam wordt één keer per taal vertaald. De planner
 * vertaalt nieuwe deals vooraf (translatePendingDeals), de rest (volglijst, prijsvergelijker,
 * ...) wordt bij het eerste bekijken vertaald.
 *
 * Vertalen kost geld, dus:
 *   - bots (zoekmachines, linkvoorbeelden, scrapers; zie src/lib/bots.ts) krijgen alleen
 *     bewaarde vertalingen en anders de Duitse naam; ze laten nooit iets nieuws vertalen;
 *   - per dag (Nederlandse tijd) vertalen we hooguit TRANSLATE_DAILY_CHAR_LIMIT tekens, voor
 *     alles samen (pagina's, planner, mail). Dat vangt ook bots die zich als browser voordoen.
 *     Is de limiet op, dan tonen pagina's de Duitse naam tot de volgende dag.
 */

/** Doeltalen met hun Amazon Translate-code; Duitse bezoekers zien gewoon de originele naam. */
const TARGETS = { nl: "nl", en: "en" } as const;
type Target = keyof typeof TARGETS;

/** Zoveel namen per keer opslaan; Amazon Translate vertaalt per tekst. */
const BATCH = 50;
/** Zoveel vertaalverzoeken tegelijk, ruim onder de standaardlimiet van AWS. */
const CONCURRENCY = 5;
/** Amazon Translate is niet in elke regio beschikbaar; Frankfurt wel. */
const DEFAULT_REGION = "eu-central-1";
/** Zo lang wacht een pagina hooguit op een nieuwe vertaling; daarna de originele naam. */
const PAGE_WAIT_MS = 2_000;
const REQUEST_TIMEOUT_MS = 30_000;
/** Tekens per dag; Amazon Translate rekent per teken. 10.000 ≈ $0,15 per dag. */
const DAILY_CHAR_LIMIT = Number(
  process.env.TRANSLATE_DAILY_CHAR_LIMIT ?? 10_000,
);
/** Zo vaak het verbruik van vandaag opnieuw uit de database lezen (meerdere servers). */
const BUDGET_REFRESH_MS = 60_000;

type Localizable = {
  id: number;
  name: string;
  shopSlug: string;
  originalName?: string;
};

export function isTranslatorConfigured() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY,
  );
}

function isTarget(lang: Locale): lang is Target {
  return lang in TARGETS;
}

/** De SDK leest de sleutels zelf uit AWS_ACCESS_KEY_ID en AWS_SECRET_ACCESS_KEY. */
let client: TranslateClient | null = null;
function getClient() {
  client ??= new TranslateClient({
    region: process.env.AWS_REGION || DEFAULT_REGION,
  });
  return client;
}

async function translateOne(text: string, target: Target): Promise<string> {
  const res = await getClient().send(
    new TranslateTextCommand({
      Text: text,
      SourceLanguageCode: "de",
      TargetLanguageCode: TARGETS[target],
    }),
    { abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
  );
  return res.TranslatedText?.trim() ?? "";
}

/** Voor het adminpanel: vertaalt één woord om te zien of de sleutels en de dienst werken. */
export async function checkTranslator(): Promise<string> {
  return translateOne("Test", "nl");
}

/** Vertaalt alle teksten, of gooit bij de eerste fout (bv. ThrottlingException). */
async function awsTranslate(
  texts: string[],
  target: Target,
): Promise<string[]> {
  const out: string[] = new Array(texts.length);
  let next = 0;
  const worker = async () => {
    while (next < texts.length) {
      const i = next++;
      out[i] = await translateOne(texts[i], target);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, texts.length) }, worker),
  );
  return out;
}

/** Begin van vandaag in Nederlandse tijd, als "YYYY-MM-DD". */
function today() {
  return new Date().toLocaleDateString("sv-SE", {
    timeZone: "Europe/Amsterdam",
  });
}

/**
 * Verbruik van vandaag: elke vertaling staat met created_at in product_translations, dus de
 * som van de vertaalde tekens van vandaag is het verbruik. Tussen twee keer lezen tellen we
 * zelf bij.
 */
const budget = { day: "", used: 0, readAt: 0 };

async function charsUsedToday(): Promise<number> {
  const day = today();
  if (budget.day !== day || Date.now() - budget.readAt > BUDGET_REFRESH_MS) {
    const [row] = await getPrisma().$queryRaw<{ used: bigint | null }[]>`
      SELECT SUM(length(source_name))::bigint AS used
      FROM product_translations
      WHERE created_at >= (${day}::date::timestamp AT TIME ZONE 'Europe/Amsterdam')`;
    budget.day = day;
    budget.used = Number(row?.used ?? 0);
    budget.readAt = Date.now();
  }
  return budget.used;
}

/** Voor het adminpanel: tekens vertaald vandaag en de daglimiet. */
export async function translationBudget() {
  return { used: await charsUsedToday(), limit: DAILY_CHAR_LIMIT };
}

let lastLimitLog = "";
function logLimitReached() {
  if (lastLimitLog === today()) return;
  lastLimitLog = today();
  console.warn(
    `[vertalen] daglimiet van ${DAILY_CHAR_LIMIT} tekens bereikt; tot morgen alleen bewaarde vertalingen`,
  );
}

/** Hooguit één foutmelding per minuut in de log (bv. bij een verkeerde sleutel). */
let lastErrorLog = 0;
function logError(err: unknown) {
  if (Date.now() - lastErrorLog < 60_000) return;
  lastErrorLog = Date.now();
  console.error("[vertalen] Amazon Translate mislukt", err);
}

/** Vertaalt en bewaart; geeft id → vertaalde naam van wat gelukt is. */
async function translateAndStore(
  items: { id: number; name: string }[],
  target: Target,
): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  const prisma = getPrisma();
  for (let i = 0; i < items.length; i += BATCH) {
    let chunk = items.slice(i, i + BATCH);
    try {
      // Alleen wat nog binnen de daglimiet past.
      await charsUsedToday();
      // Na de await opnieuw lezen: gelijktijdige vertalingen tellen ook mee.
      let left = DAILY_CHAR_LIMIT - budget.used;
      chunk = chunk.filter((c) => {
        if (c.name.length > left) return false;
        left -= c.name.length;
        return true;
      });
      if (chunk.length === 0) {
        logLimitReached();
        break;
      }
      budget.used += chunk.reduce((sum, c) => sum + c.name.length, 0);
      const names = await awsTranslate(
        chunk.map((c) => c.name),
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
 * Amazon Translate sturen.
 */
const inflight = new Map<string, Promise<string | null>>();

function translate(
  items: { id: number; name: string }[],
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
    const run = translateAndStore(todo, target);
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
 * Zet de namen van producten van Duitstalige webshops in de gevraagde taal (`originalName` =
 * de Duitse naam). Ontbrekende vertalingen worden direct opgehaald; duurt dat langer dan
 * `waitMs`, dan blijft deze keer de originele naam staan en wordt de vertaling op de
 * achtergrond bewaard voor de volgende keer. Zonder AWS-sleutels: alleen bewaarde vertalingen.
 */
export async function localizeDeals<T extends Localizable>(
  items: T[],
  lang: Locale,
  opts: { waitMs?: number; background?: boolean } = {},
): Promise<T[]> {
  if (!isTarget(lang) || !isDbConfigured()) return items;
  const german = items.filter((i) => GERMAN_SHOPS.includes(i.shopSlug));
  if (german.length === 0) return items;

  const rows = await getPrisma().productTranslation.findMany({
    where: {
      locale: lang,
      productId: { in: [...new Set(german.map((i) => BigInt(i.id)))] },
    },
    select: { productId: true, name: true, sourceName: true },
  });
  const stored = new Map(rows.map((r) => [num(r.productId), r]));
  const names = new Map<number, string>();
  const missing = new Map<number, { id: number; name: string }>();
  for (const item of german) {
    const row = stored.get(item.id);
    if (row && row.sourceName === item.name) names.set(item.id, row.name);
    else missing.set(item.id, { id: item.id, name: item.name });
  }

  if (
    missing.size > 0 &&
    isTranslatorConfigured() &&
    (opts.background || !(await fromBot()))
  ) {
    const fresh = await Promise.race([
      translate([...missing.values()], lang),
      new Promise<Map<number, string>>((resolve) =>
        setTimeout(() => resolve(new Map()), opts.waitMs ?? PAGE_WAIT_MS),
      ),
    ]);
    for (const [id, name] of fresh) names.set(id, name);
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
 * Vertaalt lopende deals van Duitstalige webshops die nog geen (actuele) vertaling hebben,
 * nieuwste eerst. Wordt elke paar minuten aangeroepen door de planner in instrumentation.ts.
 */
export async function translatePendingDeals(
  limit = 500,
): Promise<
  | { status: "not-configured" }
  | { status: "ok"; translated: number; failed: number }
> {
  if (!isTranslatorConfigured() || GERMAN_SHOPS.length === 0) {
    return { status: "not-configured" };
  }
  const prisma = getPrisma();
  let translated = 0;
  let failed = 0;
  for (const target of Object.keys(TARGETS) as Target[]) {
    const rows = await prisma.$queryRaw<{ id: bigint; name: string }[]>`
      SELECT p.id, p.name
      FROM products p
      JOIN shops s ON s.id = p.shop_id
      LEFT JOIN product_translations t ON t.product_id = p.id AND t.locale = ${target}
      WHERE p.is_deal AND s.enabled AND s.slug = ANY(${GERMAN_SHOPS})
        AND (t.product_id IS NULL OR t.source_name <> p.name)
      ORDER BY p.deal_since DESC NULLS LAST, p.id DESC
      LIMIT ${limit}`;
    if (rows.length === 0) continue;
    const done = await translate(
      rows.map((r) => ({ id: num(r.id), name: r.name })),
      target,
    );
    translated += done.size;
    failed += rows.length - done.size;
  }
  if (translated > 0) {
    console.info(`[vertalen] ${translated} productnamen vertaald`);
  }
  return { status: "ok", translated, failed };
}
