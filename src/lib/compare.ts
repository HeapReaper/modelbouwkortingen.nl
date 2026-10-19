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
const MAX_AGE_MS = 14 * 24 * 60 * 60_000;
/** Zoveel treffers op de zoektermen; meer betekent: verfijn de zoekopdracht. */
const MAX_MATCHES = 300;
const MAX_GROUPS = 60;

const SELECT = {
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

type Row = Prisma.ProductGetPayload<{ select: typeof SELECT }>;

/**
 * "TRX-3655 " → "TRX3655"; te korte of generieke nummers tellen niet als koppeling.
 * Houd gelijk met normalize_sku() in prisma/migrations/20261018000000_features (kolom sku_norm).
 */
export function normalizeSku(sku: string | null | undefined): string | null {
  const s = (sku ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.length >= 4 && /\d/.test(s) ? s : null;
}

function toOffer(r: Row): Offer {
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

export async function comparePrices(
  q: string | undefined,
  opts: {
    inStock?: boolean;
    category?: string;
    sort?: CompareSort;
    lang?: Locale;
  } = {},
): Promise<{ groups: CompareGroup[]; truncated: boolean }> {
  await connection();
  const terms = searchTerms(q);
  if (terms.length === 0) return { groups: [], truncated: false };

  let rows: { sku: string | null; offer: Offer }[];
  let truncated = false;
  if (!isDbConfigured()) {
    rows = demoDeals()
      .filter(
        (d) =>
          (!opts.category || d.categorySlug === opts.category) &&
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
  } else {
    const prisma = getPrisma();
    const base: Prisma.ProductWhereInput = {
      shop: { enabled: true },
      lastSeenAt: { gte: new Date(Date.now() - MAX_AGE_MS) },
      ...(opts.inStock ? { OR: [{ inStock: true }, { inStock: null }] } : {}),
    };
    const matches = await prisma.product.findMany({
      select: SELECT,
      where: {
        AND: [
          base,
          ...(opts.category ? [{ categorySlug: opts.category }] : []),
          ...terms.map(termWhere),
        ],
      },
      orderBy: { price: "asc" },
      take: MAX_MATCHES + 1,
    });
    truncated = matches.length > MAX_MATCHES;
    const found = matches.slice(0, MAX_MATCHES);

    // Hetzelfde artikelnummer bij andere shops, ook als de naam daar niet op de zoekterm lijkt
    // en de shop het nummer anders schrijft ("TRX-3655" / "TRX3655"): kolom sku_norm. Bewust
    // zonder categoriefilter: shops delen hetzelfde product soms anders in.
    const norms = [
      ...new Set(
        found
          .map((r) => normalizeSku(r.sku))
          .filter((s): s is string => s !== null),
      ),
    ].slice(0, 100);
    const siblings =
      norms.length === 0
        ? []
        : await prisma.product.findMany({
            select: SELECT,
            where: {
              AND: [
                base,
                { id: { notIn: found.map((r) => r.id) } },
                { skuNorm: { in: norms } },
              ],
            },
            take: 300,
          });
    rows = [...found, ...siblings].map((r) => ({
      sku: r.sku,
      offer: toOffer(r),
    }));
  }
  if (opts.lang) {
    const offers = await localizeDeals(
      rows.map((r) => r.offer),
      opts.lang,
    );
    rows = rows.map((r, i) => ({ ...r, offer: offers[i] }));
  }

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
  list.sort((a, b) =>
    opts.sort === "aanbod"
      ? b.offers.length - a.offers.length ||
        a.offers[0].price - b.offers[0].price
      : a.offers[0].price - b.offers[0].price,
  );
  return {
    groups: list.slice(0, MAX_GROUPS),
    truncated: truncated || list.length > MAX_GROUPS,
  };
}
