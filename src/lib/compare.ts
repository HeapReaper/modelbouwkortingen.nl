import "server-only";

import { connection } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/i18n/config";
import { getPrisma, isDbConfigured, num } from "@/lib/db";
import { searchNorm, searchTerms, termWhere } from "@/lib/deals";
import { demoDeals } from "@/lib/demo-data";
import { localizeDeals } from "@/lib/translate";

/**
 * Prijsvergelijker: zoekt in álle producten (niet alleen deals) en groepeert hetzelfde product
 * bij verschillende webshops. Er is geen EAN, dus "hetzelfde" = hetzelfde artikelnummer (SKU,
 * zonder spaties/streepjes); producten zonder bruikbaar artikelnummer staan los.
 */

export type Offer = {
  id: number;
  name: string;
  url: string;
  imageUrl: string | null;
  price: number;
  inStock: boolean | null;
  isDeal: boolean;
  discountPercent: number;
  categorySlug: string;
  shopSlug: string;
  shopName: string;
};

export type CompareGroup = {
  key: string;
  /** Artikelnummer zoals een van de shops het schrijft, of null. */
  sku: string | null;
  name: string;
  imageUrl: string | null;
  categorySlug: string;
  /** Goedkoopste eerst. */
  offers: Offer[];
};

export type CompareSort = "prijs" | "aanbod";

/** Producten die we zo lang niet meer zagen, zijn waarschijnlijk uit het assortiment. */
export const MAX_AGE_MS = 14 * 24 * 60 * 60_000;
/** Zoveel treffers op de zoektermen; meer betekent: verfijn de zoekopdracht. */
const MAX_MATCHES = 300;
/**
 * Complete modellen. Bij een brede zoekterm ("losi") zijn de goedkoopste treffers allemaal
 * onderdelen; deze categorieën halen we apart op en gaan voor bij het afkappen.
 */
export const MODEL_CATEGORIES = [
  "rc-autos",
  "vliegtuigen",
  "helicopters",
  "drones",
  "boten",
  "werkvoertuigen",
  "tanks",
];

export const SELECT = {
  id: true,
  name: true,
  url: true,
  sku: true,
  imageUrl: true,
  price: true,
  inStock: true,
  isDeal: true,
  discountPercent: true,
  categorySlug: true,
  shop: { select: { slug: true, name: true } },
} satisfies Prisma.ProductSelect;

export type Row = Prisma.ProductGetPayload<{ select: typeof SELECT }>;

/**
 * "TRX-3655 " → "TRX3655"; te korte of generieke nummers tellen niet als koppeling.
 * Houd gelijk met normalize_sku() in prisma/migrations/20261018000000_features (kolom sku_norm).
 */
export function normalizeSku(sku: string | null | undefined): string | null {
  const s = (sku ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.length >= 4 && /\d/.test(s) ? s : null;
}

export function toOffer(r: Row): Offer {
  return {
    id: num(r.id),
    name: r.name,
    url: r.url,
    imageUrl: r.imageUrl,
    price: num(r.price),
    inStock: r.inStock,
    isDeal: r.isDeal,
    discountPercent: num(r.discountPercent),
    categorySlug: r.categorySlug,
    shopSlug: r.shop.slug,
    shopName: r.shop.name,
  };
}

export const COMPARE_PAGE_SIZE = 24;

export type CompareResults = {
  /** Alleen de producten (groepen) van deze pagina. */
  groups: CompareGroup[];
  /** Aantal producten over alle pagina's. */
  total: number;
  totalPages: number;
  /** De getoonde pagina (begrensd op totalPages). */
  page: number;
  truncated: boolean;
};

export async function comparePrices(
  q: string | undefined,
  opts: {
    inStock?: boolean;
    category?: string;
    sort?: CompareSort;
    lang?: Locale;
    page?: number;
  } = {},
): Promise<CompareResults> {
  await connection();
  const terms = searchTerms(q);
  if (terms.length === 0)
    return { groups: [], total: 0, totalPages: 0, page: 1, truncated: false };

  let rows: OfferRow[];
  let truncated = false;
  let base: Prisma.ProductWhereInput = {};
  if (!isDbConfigured()) {
    rows = demoRows(terms, opts.category);
  } else {
    const prisma = getPrisma();
    base = {
      hidden: false,
      shop: { enabled: true },
      lastSeenAt: { gte: new Date(Date.now() - MAX_AGE_MS) },
      ...(opts.inStock ? { OR: [{ inStock: true }, { inStock: null }] } : {}),
    };
    const search = (category: Prisma.ProductWhereInput) =>
      prisma.product.findMany({
        select: SELECT,
        where: { AND: [base, category, ...terms.map(termWhere)] },
        // id als tiebreaker: bij gelijke prijzen kiest Postgres anders per keer andere rijen.
        orderBy: [{ price: "asc" }, { id: "asc" }],
        take: MAX_MATCHES + 1,
      });
    const buckets = opts.category
      ? [await search({ categorySlug: opts.category })]
      : await Promise.all([
          search({ categorySlug: { in: MODEL_CATEGORIES } }),
          search({ categorySlug: { notIn: MODEL_CATEGORIES } }),
        ]);
    truncated = buckets.some((b) => b.length > MAX_MATCHES);
    const found = buckets.flatMap((b) => b.slice(0, MAX_MATCHES));

    // Hetzelfde artikelnummer bij andere shops telt mee voor de sortering op aanbod.
    const siblings = await siblingRows(base, found, 100);
    rows = [...found, ...siblings].map((r) => ({
      sku: r.sku,
      offer: toOffer(r),
    }));
  }

  const list = groupOffers(rows);
  list.sort((a, b) =>
    opts.sort === "aanbod"
      ? b.offers.length - a.offers.length ||
        a.offers[0].price - b.offers[0].price
      : a.offers[0].price - b.offers[0].price,
  );
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / COMPARE_PAGE_SIZE));
  const page = Math.min(Math.max(1, opts.page ?? 1), totalPages);
  let groups = list.slice(
    (page - 1) * COMPARE_PAGE_SIZE,
    page * COMPARE_PAGE_SIZE,
  );
  if (isDbConfigured()) groups = await withSiblings(base, groups);
  if (opts.lang) groups = await localizeGroups(groups, opts.lang);
  return { groups, total, totalPages, page, truncated };
}

/**
 * Vult de groepen van één pagina aan met andere webshops die hetzelfde artikelnummer hebben
 * (zie siblingRows). Alleen voor de getoonde pagina, dus hooguit één extra query.
 */
export async function withSiblings(
  base: Prisma.ProductWhereInput,
  groups: CompareGroup[],
): Promise<CompareGroup[]> {
  if (groups.length === 0) return groups;
  const shown = groups.flatMap((g) =>
    g.offers.map((o) => ({ id: BigInt(o.id), sku: g.sku })),
  );
  const extra = await siblingRows(base, shown, groups.length);
  if (extra.length === 0) return groups;
  const byKey = new Map(groups.map((g) => [g.key, g]));
  const merged = groupOffers([
    ...groups.flatMap((g) => g.offers.map((offer) => ({ sku: g.sku, offer }))),
    ...extra.map((r) => ({ sku: r.sku, offer: toOffer(r) })),
  ]).filter((g) => byKey.has(g.key));
  const mergedByKey = new Map(merged.map((g) => [g.key, g]));
  return groups.map((g) => mergedByKey.get(g.key) ?? g);
}

/** Vertaalt de productnamen van de getoonde groepen (de groepsnaam is die van het goedkoopste aanbod). */
export async function localizeGroups(
  groups: CompareGroup[],
  lang: Locale,
): Promise<CompareGroup[]> {
  const offers = await localizeDeals(
    groups.flatMap((g) => g.offers),
    lang,
  );
  const byId = new Map(offers.map((o) => [o.id, o]));
  return groups.map((g) => {
    const localized = g.offers.map((o) => byId.get(o.id) ?? o);
    return { ...g, name: localized[0].name, offers: localized };
  });
}

/** Demo-modus (geen DATABASE_URL): de voorbeelddeals als zoekresultaat. */
export function demoRows(terms: string[], category?: string): OfferRow[] {
  return demoDeals()
    .filter(
      (d) =>
        (!category || d.categorySlug === category) &&
        terms.every((t) =>
          searchNorm(`${d.name} ${d.brand ?? ""}`).includes(searchNorm(t)),
        ),
    )
    .map((d) => ({
      sku: null,
      offer: {
        id: d.id,
        name: d.name,
        url: d.url,
        imageUrl: d.imageUrl,
        price: d.price,
        inStock: d.inStock,
        isDeal: true,
        discountPercent: d.discountPercent,
        categorySlug: d.categorySlug,
        shopSlug: d.shopSlug,
        shopName: d.shopName,
      },
    }));
}

/**
 * Hetzelfde artikelnummer bij andere shops, ook als de naam daar niet op de zoekterm lijkt
 * en de shop het nummer anders schrijft ("TRX-3655" / "TRX3655"): kolom sku_norm. Bewust
 * zonder categoriefilter: shops delen hetzelfde product soms anders in.
 */
export async function siblingRows(
  base: Prisma.ProductWhereInput,
  found: { id: bigint; sku: string | null }[],
  maxSkus: number,
): Promise<Row[]> {
  const norms = [
    ...new Set(
      found
        .map((r) => normalizeSku(r.sku))
        .filter((s): s is string => s !== null),
    ),
  ].slice(0, maxSkus);
  if (norms.length === 0) return [];
  return getPrisma().product.findMany({
    select: SELECT,
    where: {
      AND: [
        base,
        { id: { notIn: found.map((r) => r.id) } },
        { skuNorm: { in: norms } },
      ],
    },
    orderBy: [{ price: "asc" }, { id: "asc" }],
    take: maxSkus * 3,
  });
}

export type OfferRow = { sku: string | null; offer: Offer };

/** Groepeert aanbiedingen op artikelnummer; per groep goedkoopste eerst. */
export function groupOffers(rows: OfferRow[]): CompareGroup[] {
  const groups = new Map<string, CompareGroup>();
  for (const { sku, offer } of rows) {
    const norm = normalizeSku(sku);
    const key = norm ?? `id:${offer.id}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        sku: norm ? (sku?.trim() ?? null) : null,
        name: offer.name,
        imageUrl: offer.imageUrl,
        categorySlug: offer.categorySlug,
        offers: [],
      };
      groups.set(key, group);
    }
    // Eén aanbod per shop: bij dubbele vermeldingen (varianten) de goedkoopste.
    const same = group.offers.findIndex((o) => o.shopSlug === offer.shopSlug);
    if (same === -1) group.offers.push(offer);
    else if (offer.price < group.offers[same].price) group.offers[same] = offer;
  }

  const list = [...groups.values()];
  for (const g of list) {
    g.offers.sort((a, b) => a.price - b.price);
    // Naam en foto van het goedkoopste aanbod; foto van een ander als die ontbreekt.
    g.name = g.offers[0].name;
    g.imageUrl = g.offers.find((o) => o.imageUrl)?.imageUrl ?? null;
    g.categorySlug = g.offers[0].categorySlug;
  }
  return list;
}
