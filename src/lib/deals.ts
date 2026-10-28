import "server-only";

import { connection } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { CATEGORIES } from "@/lib/categories";
import { cached, getPrisma, isDbConfigured, num } from "@/lib/db";
import { demoDeals, demoHistory } from "@/lib/demo-data";
import { type DealFilters, PAGE_SIZE, type SortKey } from "@/lib/filters";
import {
  type DealPreferences,
  matchesPreferences,
  NO_PREFERENCES,
} from "@/lib/preferences";
import { SHOPS } from "@/lib/shops";

export type { DealFilters, SortKey };

export type Deal = {
  id: number;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  url: string;
  price: number;
  oldPrice: number | null;
  referencePrice: number | null;
  discountAmount: number;
  discountPercent: number;
  inStock: boolean | null;
  dealSince: string | null;
  categorySlug: string;
  shopCategory: string | null;
  shopSlug: string;
  shopName: string;
  /** De originele naam als `name` vertaald is (zie localizeDeals() in src/lib/translate.ts). */
  originalName?: string;
  sku: string | null;
  /** false = het product is (nu) geen deal meer, bv. op de volglijst of bij een prijsalarm. */
  isDeal: boolean;
  firstSeenAt: string;
  /**
   * "ever" = laagste prijs die we ooit zagen (en we volgen het product al lang genoeg),
   * "30d" = laagste prijs van de afgelopen 30 dagen. Zie withPriceInsights().
   */
  lowest: "ever" | "30d" | null;
};

/** Pas na zoveel dagen volgen zegt "laagste prijs" iets. */
const LOWEST_30D_MIN_DAYS = 30;
const LOWEST_EVER_MIN_DAYS = 60;
const DAY_MS = 24 * 60 * 60_000;

const DEAL_SELECT = {
  id: true,
  name: true,
  sku: true,
  isDeal: true,
  firstSeenAt: true,
  brand: true,
  imageUrl: true,
  url: true,
  price: true,
  oldPrice: true,
  referencePrice: true,
  discountAmount: true,
  discountPercent: true,
  inStock: true,
  dealSince: true,
  categorySlug: true,
  shopCategory: true,
  shop: { select: { slug: true, name: true } },
} satisfies Prisma.ProductSelect;

type Row = Prisma.ProductGetPayload<{ select: typeof DEAL_SELECT }>;

function toDeal(r: Row): Deal {
  return {
    id: num(r.id),
    name: r.name,
    brand: r.brand,
    imageUrl: r.imageUrl,
    url: r.url,
    price: num(r.price),
    oldPrice: num(r.oldPrice),
    referencePrice: num(r.referencePrice),
    discountAmount: num(r.discountAmount),
    discountPercent: num(r.discountPercent),
    inStock: r.inStock,
    dealSince: r.dealSince?.toISOString() ?? null,
    categorySlug: r.categorySlug,
    shopCategory: r.shopCategory,
    shopSlug: r.shop.slug,
    shopName: r.shop.name,
    sku: r.sku,
    isDeal: r.isDeal,
    firstSeenAt: r.firstSeenAt.toISOString(),
    lowest: null,
  };
}

/**
 * Vult `lowest` in: is de huidige prijs de laagste die we zagen? Twee groupBy's over
 * price_history voor alle getoonde producten tegelijk (index op product_id).
 */
async function withPriceInsights(deals: Deal[]): Promise<Deal[]> {
  if (deals.length === 0 || !isDbConfigured()) return deals;
  const now = Date.now();
  const tracked = (d: Deal, days: number) =>
    now - new Date(d.firstSeenAt).getTime() >= days * DAY_MS;
  const candidates = deals.filter((d) => tracked(d, LOWEST_30D_MIN_DAYS));
  if (candidates.length === 0) return deals;
  const ids = candidates.map((d) => BigInt(d.id));
  const prisma = getPrisma();
  const [ever, month] = await Promise.all([
    prisma.priceHistory.groupBy({
      by: ["productId"],
      where: { productId: { in: ids } },
      _min: { price: true },
    }),
    prisma.priceHistory.groupBy({
      by: ["productId"],
      where: {
        productId: { in: ids },
        observedAt: { gte: new Date(now - 30 * DAY_MS) },
      },
      _min: { price: true },
    }),
  ]);
  const minOf = (rows: typeof ever) =>
    new Map(rows.map((r) => [num(r.productId), num(r._min.price)]));
  const minEver = minOf(ever);
  const min30 = minOf(month);
  // Halve centen marge tegen afrondingsverschillen tussen Decimal en number.
  const atMost = (price: number, min: number | null | undefined) =>
    min !== null && min !== undefined && price <= min + 0.005;
  return deals.map((d) => {
    if (!tracked(d, LOWEST_30D_MIN_DAYS)) return d;
    if (tracked(d, LOWEST_EVER_MIN_DAYS) && atMost(d.price, minEver.get(d.id)))
      return { ...d, lowest: "ever" };
    if (atMost(d.price, min30.get(d.id))) return { ...d, lowest: "30d" };
    return d;
  });
}

const ORDER_BY: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
  korting: [
    { discountPercent: "desc" },
    { discountAmount: "desc" },
    { id: "desc" },
  ],
  besparing: [
    { discountAmount: "desc" },
    { discountPercent: "desc" },
    { id: "desc" },
  ],
  nieuw: [{ dealSince: { sort: "desc", nulls: "last" } }, { id: "desc" }],
  "prijs-laag": [{ price: "asc" }, { id: "desc" }],
  "prijs-hoog": [{ price: "desc" }, { id: "desc" }],
};

/** Producten van ingeschakelde shops, buiten de categorieën die bij die shop verborgen zijn. */
const VISIBLE = {
  hidden: false,
  shop: { enabled: true },
} satisfies Prisma.ProductWhereInput;

/** Actieve deals van ingeschakelde shops. */
const ACTIVE_DEAL = {
  ...VISIBLE,
  isDeal: true,
} satisfies Prisma.ProductWhereInput;

/** in_stock IS NOT FALSE: op voorraad of onbekend. */
const NOT_OUT_OF_STOCK = {
  OR: [{ inStock: true }, { inStock: null }],
} satisfies Prisma.ProductWhereInput;

export async function getDeals(
  filters: DealFilters,
  pageSize = PAGE_SIZE,
): Promise<{ deals: Deal[]; total: number }> {
  await connection();
  const page = filters.page ?? 1;
  if (!isDbConfigured()) return filterDemo(filters, pageSize);

  const and: Prisma.ProductWhereInput[] = [ACTIVE_DEAL];
  if (filters.category) and.push({ categorySlug: filters.category });
  if (filters.shop) and.push({ shop: { slug: filters.shop } });
  if (filters.brands) and.push({ brand: { in: filters.brands } });
  if (filters.minDiscount)
    and.push({ discountPercent: { gte: filters.minDiscount } });
  if (filters.minPrice) and.push({ price: { gte: filters.minPrice } });
  if (filters.maxPrice) and.push({ price: { lte: filters.maxPrice } });
  if (filters.inStock) and.push(NOT_OUT_OF_STOCK);
  for (const term of searchTerms(filters.q)) and.push(termWhere(term));
  const where: Prisma.ProductWhereInput = { AND: and };
  const prisma = getPrisma();
  const [rows, total] = await prisma.$transaction([
    prisma.product.findMany({
      select: DEAL_SELECT,
      where,
      orderBy: ORDER_BY[filters.sort ?? "korting"],
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.product.count({ where }),
  ]);
  return { deals: await withPriceInsights(rows.map(toDeal)), total };
}

/** Kleine letters, alleen a-z en 0-9. Houd gelijk met normalize_search() (kolom search_norm). */
export function searchNorm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Eén zoekterm: los van spelling met streepjes/spaties ("eflite" vindt ook "E-flite"). */
export function termWhere(term: string): Prisma.ProductWhereInput {
  const contains = { contains: term, mode: "insensitive" } as const;
  const norm = searchNorm(term);
  return {
    OR: [
      { name: contains },
      { brand: contains },
      { sku: contains },
      // Ook op de vertaalde naam van producten van anderstalige webshops.
      { translations: { some: { name: contains } } },
      ...(norm ? [{ searchNorm: { contains: norm } }] : []),
    ],
  };
}

export function searchTerms(q?: string) {
  return (
    (q ?? "")
      .toLowerCase()
      // Ook "/", "," enz. scheiden termen: "losi/nascar" = "losi" + "nascar". Een schaal als
      // "1/10" (cijfers aan beide kanten) blijft één term.
      .split(/[\s,;+&|]+|(?<!\d)\/|\/(?!\d)/)
      .map((t) => t.replace(/[%_\\]/g, ""))
      .filter((t) => t.length > 0)
      .slice(0, 6)
  );
}

/** Hoogste kortingen, eventueel alleen uit deze categorieën. */
export async function getTopDeals(
  limit = 12,
  categories?: string[],
): Promise<Deal[]> {
  await connection();
  if (!isDbConfigured())
    return filterDemo({ sort: "korting" })
      .deals.filter((d) => categories?.includes(d.categorySlug) ?? true)
      .slice(0, limit);
  const key = `top:${limit}:${categories?.join(",") ?? ""}`;
  return cached(key, 60_000, async () => {
    // Maximaal 4 per shop zodat één shop de rij niet domineert.
    const prisma = getPrisma();
    const shops = await prisma.shop.findMany({
      where: { enabled: true },
      select: { id: true },
    });
    const perShop = await Promise.all(
      shops.map((s) =>
        prisma.product.findMany({
          select: DEAL_SELECT,
          where: {
            ...ACTIVE_DEAL,
            ...NOT_OUT_OF_STOCK,
            shopId: s.id,
            imageUrl: { not: null },
            ...(categories ? { categorySlug: { in: categories } } : {}),
          },
          orderBy: { discountPercent: "desc" },
          take: 4,
        }),
      ),
    );
    return withPriceInsights(
      perShop
        .flat()
        .map(toDeal)
        .sort((a, b) => b.discountPercent - a.discountPercent)
        .slice(0, limit),
    );
  });
}

/**
 * Lopende deals die ná de cursor (deal_since, product-id) zijn ontstaan, oudste eerst (voor de
 * Discord-meldingen). Het id breekt gelijke tijdstempels, zodat niets dubbel of overgeslagen wordt.
 */
export async function getDealsAfter(
  cursorAt: Date,
  cursorId: bigint,
  limit: number,
  prefs: DealPreferences = NO_PREFERENCES,
): Promise<Deal[]> {
  if (!isDbConfigured()) return [];
  // De cursor is een JS Date (milliseconden); een deal_since met microseconden binnen dezelfde
  // milliseconde telt als gelijk aan de cursor, anders zou die deal elke ronde terugkomen.
  const nextMs = new Date(cursorAt.getTime() + 1);
  const rows = await getPrisma().product.findMany({
    select: DEAL_SELECT,
    where: {
      ...ACTIVE_DEAL,
      OR: [
        { dealSince: { gte: nextMs } },
        { dealSince: { gte: cursorAt, lt: nextMs }, id: { gt: cursorId } },
      ],
      ...(prefs.categories.length > 0
        ? { categorySlug: { in: prefs.categories } }
        : {}),
      ...(prefs.shops.length > 0
        ? { shop: { enabled: true, slug: { in: prefs.shops } } }
        : {}),
      ...(prefs.minDiscount > 0
        ? { discountPercent: { gte: prefs.minDiscount } }
        : {}),
    },
    orderBy: [{ dealSince: "asc" }, { id: "asc" }],
    take: limit,
  });
  return rows.map(toDeal);
}

/**
 * Deals die sinds `since` zijn ontstaan en nog lopen, hoogste korting eerst (voor de dagelijkse
 * kortingsmail; per abonnee gefilterd en ingekort met pickDigest()).
 */
export async function getDealsSince(since: Date, limit = 500): Promise<Deal[]> {
  if (!isDbConfigured())
    return filterDemo({ sort: "korting" }).deals.slice(0, limit);
  const rows = await getPrisma().product.findMany({
    select: DEAL_SELECT,
    where: {
      ...ACTIVE_DEAL,
      ...NOT_OUT_OF_STOCK,
      imageUrl: { not: null },
      dealSince: { gte: since },
    },
    orderBy: [{ discountPercent: "desc" }, { discountAmount: "desc" }],
    take: limit,
  });
  return rows.map(toDeal);
}

/**
 * De eerste `limit` deals (al gesorteerd) die bij de voorkeuren passen, met maximaal `perShop`
 * per webshop zodat één shop de mail niet domineert.
 */
export function pickDigest(
  deals: Deal[],
  prefs: DealPreferences = NO_PREFERENCES,
  limit = 12,
  perShop = 3,
): Deal[] {
  const counts = new Map<string, number>();
  const out: Deal[] = [];
  for (const deal of deals) {
    if (!matchesPreferences(deal, prefs)) continue;
    const n = counts.get(deal.shopSlug) ?? 0;
    if (n >= perShop) continue;
    counts.set(deal.shopSlug, n + 1);
    out.push(deal);
    if (out.length === limit) break;
  }
  return out;
}

export async function getNewestDeals(limit = 12): Promise<Deal[]> {
  await connection();
  if (!isDbConfigured())
    return filterDemo({ sort: "nieuw" }).deals.slice(0, limit);
  return cached(`newest:${limit}`, 60_000, async () => {
    const rows = await getPrisma().product.findMany({
      select: DEAL_SELECT,
      where: { ...ACTIVE_DEAL, imageUrl: { not: null } },
      orderBy: [
        { dealSince: { sort: "desc", nulls: "last" } },
        { discountPercent: "desc" },
      ],
      take: limit,
    });
    return withPriceInsights(rows.map(toDeal));
  });
}

export async function getDeal(id: number): Promise<Deal | null> {
  await connection();
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  if (!isDbConfigured()) return demoDeals().find((d) => d.id === id) ?? null;
  const row = await getPrisma().product.findUnique({
    select: DEAL_SELECT,
    where: { id: BigInt(id) },
  });
  if (!row) return null;
  const [deal] = await withPriceInsights([toDeal(row)]);
  return deal;
}

/** Producten (deal of niet) in de opgegeven volgorde, voor de volglijst. */
export async function getDealsByIds(ids: number[]): Promise<Deal[]> {
  await connection();
  const valid = [
    ...new Set(ids.filter((id) => Number.isSafeInteger(id) && id > 0)),
  ].slice(0, 100);
  if (valid.length === 0) return [];
  if (!isDbConfigured())
    return valid.flatMap((id) => demoDeals().find((d) => d.id === id) ?? []);
  const rows = await getPrisma().product.findMany({
    select: DEAL_SELECT,
    where: { id: { in: valid.map(BigInt) }, ...VISIBLE },
  });
  const byId = new Map(rows.map((r) => [num(r.id), toDeal(r)]));
  return withPriceInsights(valid.flatMap((id) => byId.get(id) ?? []));
}

/** Producten die we zo lang niet meer zagen, zijn waarschijnlijk uit het assortiment. */
const ALTERNATIVE_MAX_AGE_MS = 14 * DAY_MS;

/**
 * Hetzelfde product bij andere webshops (zelfde genormaliseerde SKU, zie normalizeSku() en de
 * kolom sku_norm), goedkoopste eerst. Eén aanbod per shop.
 */
export async function getAlternatives(deal: Deal, limit = 10): Promise<Deal[]> {
  await connection();
  if (!isDbConfigured() || !deal.sku) return [];
  const prisma = getPrisma();
  const self = await prisma.product.findUnique({
    select: { skuNorm: true },
    where: { id: BigInt(deal.id) },
  });
  if (!self?.skuNorm) return [];
  const rows = await prisma.product.findMany({
    select: DEAL_SELECT,
    where: {
      skuNorm: self.skuNorm,
      id: { not: BigInt(deal.id) },
      hidden: false,
      shop: { enabled: true, slug: { not: deal.shopSlug } },
      lastSeenAt: { gte: new Date(Date.now() - ALTERNATIVE_MAX_AGE_MS) },
    },
    orderBy: [{ price: "asc" }, { id: "asc" }],
    take: 50,
  });
  const seen = new Set<string>();
  const out: Deal[] = [];
  for (const row of rows) {
    if (seen.has(row.shop.slug)) continue;
    seen.add(row.shop.slug);
    out.push(toDeal(row));
    if (out.length === limit) break;
  }
  return out;
}

export type PricePoint = {
  date: string;
  price: number;
  oldPrice: number | null;
};

export async function getPriceHistory(id: number): Promise<PricePoint[]> {
  await connection();
  if (!isDbConfigured()) return demoHistory(id);
  const rows = await getPrisma().priceHistory.findMany({
    select: { observedAt: true, price: true, oldPrice: true },
    where: { productId: BigInt(id) },
    orderBy: { observedAt: "asc" },
    take: 500,
  });
  return rows.map((r) => ({
    date: r.observedAt.toISOString(),
    price: num(r.price),
    oldPrice: num(r.oldPrice),
  }));
}

/* ---------- merken ---------- */

export type Brand = {
  slug: string;
  name: string;
  /** Alle schrijfwijzen die de webshops gebruiken ("ARRMA", "Arrma"). */
  variants: string[];
  deals: number;
};

/** "Team Corally" → "team-corally". */
export function brandSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Merken met lopende deals, meeste deals eerst. */
export async function getBrands(): Promise<Brand[]> {
  await connection();
  const counts = new Map<string, number>();
  if (!isDbConfigured()) {
    for (const d of demoDeals())
      if (d.brand) counts.set(d.brand, (counts.get(d.brand) ?? 0) + 1);
  } else {
    const rows = await cached("brands", 5 * 60_000, () =>
      getPrisma().product.groupBy({
        by: ["brand"],
        where: { ...ACTIVE_DEAL, brand: { not: null } },
        _count: true,
      }),
    );
    for (const r of rows) if (r.brand) counts.set(r.brand, r._count);
  }
  const brands = new Map<string, Brand>();
  for (const [name, n] of counts) {
    const slug = brandSlug(name);
    if (!slug) continue;
    const brand = brands.get(slug);
    if (!brand) {
      brands.set(slug, { slug, name, variants: [name], deals: n });
      continue;
    }
    brand.variants.push(name);
    brand.deals += n;
    // De schrijfwijze met de meeste deals is de naam (meestal "Arrma", niet "ARRMA").
    if (n > (counts.get(brand.name) ?? 0)) brand.name = name;
  }
  return [...brands.values()].sort(
    (a, b) => b.deals - a.deals || a.name.localeCompare(b.name),
  );
}

export async function getBrand(slug: string): Promise<Brand | null> {
  return (await getBrands()).find((b) => b.slug === slug) ?? null;
}

export async function getRelatedDeals(deal: Deal, limit = 8): Promise<Deal[]> {
  const { deals } = await getDeals({
    category: deal.categorySlug,
    sort: "korting",
  });
  return deals.filter((d) => d.id !== deal.id).slice(0, limit);
}

export type SiteStats = {
  deals: number;
  products: number;
  shops: number;
  maxDiscount: number;
  totalSavings: number;
  lastUpdate: string | null;
  byCategory: Record<string, number>;
  byShop: Record<string, number>;
};

export async function getSiteStats(): Promise<SiteStats> {
  await connection();
  if (!isDbConfigured()) return demoStats();
  return cached("site-stats", 60_000, async () => {
    const prisma = getPrisma();
    const [all, deals, cats, shops] = await Promise.all([
      prisma.product.aggregate({
        where: VISIBLE,
        _count: true,
        _max: { updatedAt: true },
      }),
      prisma.product.aggregate({
        where: ACTIVE_DEAL,
        _count: true,
        _max: { discountPercent: true },
        _sum: { discountAmount: true },
      }),
      prisma.product.groupBy({
        by: ["categorySlug"],
        where: ACTIVE_DEAL,
        _count: true,
      }),
      prisma.shop.findMany({
        where: { enabled: true },
        select: {
          slug: true,
          _count: {
            select: { products: { where: { isDeal: true, hidden: false } } },
          },
        },
      }),
    ]);
    return {
      deals: deals._count,
      products: all._count,
      shops: shops.length || SHOPS.length,
      maxDiscount: Math.round(num(deals._max.discountPercent) ?? 0),
      totalSavings: num(deals._sum.discountAmount) ?? 0,
      lastUpdate: all._max.updatedAt?.toISOString() ?? null,
      byCategory: Object.fromEntries(
        cats.map((c) => [c.categorySlug, c._count]),
      ),
      byShop: Object.fromEntries(shops.map((s) => [s.slug, s._count.products])),
    };
  });
}

/* ---------- demo-modus (geen DATABASE_URL) ---------- */

function filterDemo(f: DealFilters, pageSize = PAGE_SIZE) {
  let list = demoDeals();
  const terms = searchTerms(f.q);
  list = list.filter(
    (d) =>
      (!f.category || d.categorySlug === f.category) &&
      (!f.shop || d.shopSlug === f.shop) &&
      (!f.brands || (d.brand !== null && f.brands.includes(d.brand))) &&
      (!f.minDiscount || d.discountPercent >= f.minDiscount) &&
      (!f.minPrice || d.price >= f.minPrice) &&
      (!f.maxPrice || d.price <= f.maxPrice) &&
      (!f.inStock || d.inStock !== false) &&
      terms.every((t) =>
        searchNorm(`${d.name} ${d.brand ?? ""}`).includes(searchNorm(t)),
      ),
  );
  const sorters: Record<SortKey, (a: Deal, b: Deal) => number> = {
    korting: (a, b) => b.discountPercent - a.discountPercent,
    besparing: (a, b) => b.discountAmount - a.discountAmount,
    nieuw: (a, b) => (b.dealSince ?? "").localeCompare(a.dealSince ?? ""),
    "prijs-laag": (a, b) => a.price - b.price,
    "prijs-hoog": (a, b) => b.price - a.price,
  };
  list.sort(sorters[f.sort ?? "korting"]);
  const page = f.page ?? 1;
  return {
    deals: list.slice((page - 1) * pageSize, page * pageSize),
    total: list.length,
  };
}

function demoStats(): SiteStats {
  const list = demoDeals();
  const byCategory: Record<string, number> = {};
  const byShop: Record<string, number> = {};
  for (const d of list) {
    byCategory[d.categorySlug] = (byCategory[d.categorySlug] ?? 0) + 1;
    byShop[d.shopSlug] = (byShop[d.shopSlug] ?? 0) + 1;
  }
  for (const c of CATEGORIES) byCategory[c.slug] ??= 0;
  return {
    deals: list.length,
    products: list.length * 14,
    shops: SHOPS.length,
    maxDiscount: Math.round(Math.max(...list.map((d) => d.discountPercent))),
    totalSavings: list.reduce((s, d) => s + d.discountAmount, 0),
    lastUpdate: new Date().toISOString(),
    byCategory,
    byShop,
  };
}
