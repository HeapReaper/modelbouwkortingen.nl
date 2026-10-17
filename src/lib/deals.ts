import "server-only";

import { connection } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { CATEGORIES } from "@/lib/categories";
import { cached, getPrisma, isDbConfigured, num } from "@/lib/db";
import { demoDeals, demoHistory } from "@/lib/demo-data";
import { type DealFilters, PAGE_SIZE, type SortKey } from "@/lib/filters";
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
};

const DEAL_SELECT = {
  id: true,
  name: true,
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
  };
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

/** Actieve deals van ingeschakelde shops. */
const ACTIVE_DEAL = {
  isDeal: true,
  shop: { enabled: true },
} satisfies Prisma.ProductWhereInput;

/** in_stock IS NOT FALSE: op voorraad of onbekend. */
const NOT_OUT_OF_STOCK = {
  OR: [{ inStock: true }, { inStock: null }],
} satisfies Prisma.ProductWhereInput;

export async function getDeals(
  filters: DealFilters,
): Promise<{ deals: Deal[]; total: number }> {
  await connection();
  const page = filters.page ?? 1;
  if (!isDbConfigured()) return filterDemo(filters);

  const and: Prisma.ProductWhereInput[] = [ACTIVE_DEAL];
  if (filters.category) and.push({ categorySlug: filters.category });
  if (filters.shop) and.push({ shop: { slug: filters.shop } });
  if (filters.minDiscount)
    and.push({ discountPercent: { gte: filters.minDiscount } });
  if (filters.minPrice) and.push({ price: { gte: filters.minPrice } });
  if (filters.maxPrice) and.push({ price: { lte: filters.maxPrice } });
  if (filters.inStock) and.push(NOT_OUT_OF_STOCK);
  for (const term of searchTerms(filters.q)) {
    const contains = { contains: term, mode: "insensitive" } as const;
    and.push({
      OR: [{ name: contains }, { brand: contains }, { sku: contains }],
    });
  }
  const where: Prisma.ProductWhereInput = { AND: and };
  const prisma = getPrisma();
  const [rows, total] = await prisma.$transaction([
    prisma.product.findMany({
      select: DEAL_SELECT,
      where,
      orderBy: ORDER_BY[filters.sort ?? "korting"],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);
  return { deals: rows.map(toDeal), total };
}

export function searchTerms(q?: string) {
  return (q ?? "")
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[%_\\]/g, ""))
    .filter((t) => t.length > 0)
    .slice(0, 6);
}

export async function getTopDeals(limit = 12): Promise<Deal[]> {
  await connection();
  if (!isDbConfigured())
    return filterDemo({ sort: "korting" }).deals.slice(0, limit);
  return cached(`top:${limit}`, 60_000, async () => {
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
          },
          orderBy: { discountPercent: "desc" },
          take: 4,
        }),
      ),
    );
    return perShop
      .flat()
      .map(toDeal)
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, limit);
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
): Promise<Deal[]> {
  if (!isDbConfigured()) return [];
  const rows = await getPrisma().product.findMany({
    select: DEAL_SELECT,
    where: {
      ...ACTIVE_DEAL,
      OR: [
        { dealSince: { gt: cursorAt } },
        { dealSince: cursorAt, id: { gt: cursorId } },
      ],
    },
    orderBy: [{ dealSince: "asc" }, { id: "asc" }],
    take: limit,
  });
  return rows.map(toDeal);
}

/**
 * Deals die sinds `since` zijn ontstaan en nog lopen, hoogste korting eerst, met maximaal
 * `perShop` per webshop (voor de dagelijkse kortingsmail).
 */
export async function getDealsSince(
  since: Date,
  limit = 12,
  perShop = 3,
): Promise<Deal[]> {
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
    take: limit * 10,
  });
  const counts = new Map<string, number>();
  const out: Deal[] = [];
  for (const deal of rows.map(toDeal)) {
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
    return rows.map(toDeal);
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
  return row ? toDeal(row) : null;
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
        where: { shop: { enabled: true } },
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
          _count: { select: { products: { where: { isDeal: true } } } },
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

function filterDemo(f: DealFilters) {
  let list = demoDeals();
  const terms = searchTerms(f.q);
  list = list.filter(
    (d) =>
      (!f.category || d.categorySlug === f.category) &&
      (!f.shop || d.shopSlug === f.shop) &&
      (!f.minDiscount || d.discountPercent >= f.minDiscount) &&
      (!f.minPrice || d.price >= f.minPrice) &&
      (!f.maxPrice || d.price <= f.maxPrice) &&
      (!f.inStock || d.inStock !== false) &&
      terms.every((t) =>
        `${d.name} ${d.brand ?? ""}`.toLowerCase().includes(t),
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
    deals: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
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
