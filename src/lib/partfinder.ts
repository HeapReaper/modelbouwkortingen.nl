import "server-only";

import { connection } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/config";
import {
  type CompareGroup,
  demoRows,
  groupOffers,
  MAX_AGE_MS,
  MODEL_CATEGORIES,
  normalizeSku,
  type OfferRow,
  SELECT,
  siblingRows,
  toOffer,
} from "@/lib/compare";
import { getPrisma, isDbConfigured } from "@/lib/db";
import { searchTerms, termWhere } from "@/lib/deals";
import { localizeDeals } from "@/lib/translate";

/**
 * Partfinder: doorzoekt de hele database (modellen, onderdelen, artikelnummers) en laat per
 * product zien welke webshops het hebben en of het in de aanbieding is. Anders dan de
 * prijsvergelijker zonder harde grens van 60 resultaten: alles, met paginering.
 */

export type PartSort =
  | "relevantie"
  | "prijs-laag"
  | "prijs-hoog"
  | "korting"
  | "aanbod";

export const PART_SORTS: PartSort[] = [
  "relevantie",
  "prijs-laag",
  "prijs-hoog",
  "korting",
  "aanbod",
];

export type PartFilters = {
  q?: string;
  category?: string;
  shop?: string;
  inStock?: boolean;
  dealsOnly?: boolean;
  sort?: PartSort;
  page?: number;
};

export type PartResults = {
  groups: CompareGroup[];
  /** Aantal producten (groepen) over alle pagina's. */
  total: number;
  /** Aantal treffers per webshop, vóór het webshopfilter (om op te filteren). */
  shops: { slug: string; name: string; count: number }[];
  deals: number;
  totalPages: number;
  /** Meer treffers dan we in één keer bekijken: verfijn de zoekopdracht. */
  truncated: boolean;
};

export const PART_PAGE_SIZE = 24;
/** Zoveel treffers per bucket (modellen / rest); daarboven: verfijn de zoekopdracht. */
const MAX_MATCHES = 1500;

const EMPTY: PartResults = {
  groups: [],
  total: 0,
  shops: [],
  deals: 0,
  totalPages: 0,
  truncated: false,
};

export async function findParts(
  f: PartFilters,
  lang?: Locale,
): Promise<PartResults> {
  await connection();
  const terms = searchTerms(f.q);
  if (terms.length === 0) return EMPTY;

  let rows: OfferRow[];
  let truncated = false;
  let base: Prisma.ProductWhereInput = {};
  if (!isDbConfigured()) {
    rows = demoRows(terms, f.category).filter(
      (r) =>
        (!f.inStock || r.offer.inStock !== false) &&
        (!f.dealsOnly || r.offer.isDeal),
    );
  } else {
    base = {
      hidden: false,
      shop: { enabled: true },
      lastSeenAt: { gte: new Date(Date.now() - MAX_AGE_MS) },
      ...(f.inStock ? { OR: [{ inStock: true }, { inStock: null }] } : {}),
    };
    const where = (category: Prisma.ProductWhereInput) => ({
      AND: [
        base,
        category,
        ...(f.dealsOnly ? [{ isDeal: true }] : []),
        ...terms.map(termWhere),
      ],
    });
    const search = (category: Prisma.ProductWhereInput) =>
      getPrisma().product.findMany({
        select: SELECT,
        where: where(category),
        orderBy: [{ price: "asc" }, { id: "asc" }],
        take: MAX_MATCHES + 1,
      });
    // Modellen apart, anders verdringen goedkope onderdelen ze bij een brede zoekterm.
    const buckets = f.category
      ? [await search({ categorySlug: f.category })]
      : await Promise.all([
          search({ categorySlug: { in: MODEL_CATEGORIES } }),
          search({ categorySlug: { notIn: MODEL_CATEGORIES } }),
        ]);
    truncated = buckets.some((b) => b.length > MAX_MATCHES);
    rows = buckets
      .flatMap((b) => b.slice(0, MAX_MATCHES))
      .map((r) => ({ sku: r.sku, offer: toOffer(r) }));
  }

  // Webshopfilter pas hier, zodat de tellingen per webshop alle treffers laten zien.
  const shopCounts = new Map<string, { name: string; count: number }>();
  for (const { offer } of rows) {
    const s = shopCounts.get(offer.shopSlug);
    if (s) s.count++;
    else shopCounts.set(offer.shopSlug, { name: offer.shopName, count: 1 });
  }
  if (f.shop) rows = rows.filter((r) => r.offer.shopSlug === f.shop);

  const list = groupOffers(rows);
  sortGroups(list, f.sort ?? "relevantie", f.q ?? "", terms);
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / PART_PAGE_SIZE));
  const page = Math.min(Math.max(1, f.page ?? 1), totalPages);
  let groups = list.slice((page - 1) * PART_PAGE_SIZE, page * PART_PAGE_SIZE);

  // Andere webshops met hetzelfde artikelnummer, alleen voor deze pagina (zonder webshop- en
  // dealfilter: je wilt juist zien waar het nog meer te koop is).
  if (isDbConfigured() && groups.length > 0) {
    const shown = groups.flatMap((g) =>
      g.offers.map((o) => ({ id: BigInt(o.id), sku: g.sku })),
    );
    const extra = await siblingRows(base, shown, PART_PAGE_SIZE);
    if (extra.length > 0) {
      const byKey = new Map(groups.map((g) => [g.key, g]));
      const merged = groupOffers([
        ...groups.flatMap((g) =>
          g.offers.map((offer) => ({ sku: g.sku, offer })),
        ),
        ...extra.map((r) => ({ sku: r.sku, offer: toOffer(r) })),
      ]).filter((g) => byKey.has(g.key));
      const mergedByKey = new Map(merged.map((g) => [g.key, g]));
      groups = groups.map((g) => mergedByKey.get(g.key) ?? g);
    }
  }

  if (lang) {
    const offers = await localizeDeals(
      groups.flatMap((g) => g.offers),
      lang,
    );
    const byId = new Map(offers.map((o) => [o.id, o]));
    groups = groups.map((g) => {
      const localized = g.offers.map((o) => byId.get(o.id) ?? o);
      return { ...g, name: localized[0].name, offers: localized };
    });
  }

  return {
    groups,
    total,
    totalPages,
    truncated,
    deals: list.filter((g) => g.offers.some((o) => o.isDeal)).length,
    shops: [...shopCounts]
      .map(([slug, s]) => ({ slug, ...s }))
      .sort((a, b) => b.count - a.count),
  };
}

function sortGroups(
  list: CompareGroup[],
  sort: PartSort,
  q: string,
  terms: string[],
) {
  const price = (g: CompareGroup) => g.offers[0].price;
  const discount = (g: CompareGroup) =>
    Math.max(...g.offers.map((o) => (o.isDeal ? o.discountPercent : 0)));
  if (sort === "prijs-laag") list.sort((a, b) => price(a) - price(b));
  else if (sort === "prijs-hoog") list.sort((a, b) => price(b) - price(a));
  else if (sort === "korting")
    list.sort((a, b) => discount(b) - discount(a) || price(a) - price(b));
  else if (sort === "aanbod")
    list.sort(
      (a, b) => b.offers.length - a.offers.length || price(a) - price(b),
    );
  else {
    const score = relevance(q, terms);
    const scores = new Map(list.map((g) => [g.key, score(g)]));
    list.sort(
      (a, b) =>
        (scores.get(b.key) ?? 0) - (scores.get(a.key) ?? 0) ||
        price(a) - price(b),
    );
  }
}

/**
 * Eenvoudige relevantie: exact artikelnummer bovenaan, dan treffers in de naam (liefst aan het
 * begin), complete modellen, deals en producten die bij meer webshops liggen.
 */
function relevance(q: string, terms: string[]) {
  const skus = new Set(
    [q, ...terms].map(normalizeSku).filter((s): s is string => s !== null),
  );
  return (g: CompareGroup) => {
    const name = g.name.toLowerCase();
    let score = 0;
    if (g.sku && skus.has(normalizeSku(g.sku) ?? "")) score += 1000;
    for (const t of terms) {
      if (name.startsWith(t)) score += 15;
      else if (new RegExp(`\\b${escapeRegExp(t)}\\b`).test(name)) score += 10;
      else if (name.includes(t)) score += 5;
    }
    if (MODEL_CATEGORIES.includes(g.categorySlug)) score += 20;
    if (g.offers.some((o) => o.isDeal)) score += 8;
    score += Math.min(g.offers.length, 5) * 3;
    return score;
  };
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
