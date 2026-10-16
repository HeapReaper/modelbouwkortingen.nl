import "server-only";

import { connection } from "next/server";
import { CATEGORIES } from "@/lib/categories";
import { cached, isDbConfigured, query } from "@/lib/db";
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

type Row = {
  id: number;
  name: string;
  brand: string | null;
  image_url: string | null;
  url: string;
  price: number;
  old_price: number | null;
  reference_price: number | null;
  discount_amount: number;
  discount_percent: number;
  in_stock: boolean | null;
  deal_since: Date | null;
  category_slug: string;
  shop_category: string | null;
  shop_slug: string;
  shop_name: string;
  total?: number;
};

const SELECT = `
  SELECT p.id, p.name, p.brand, p.image_url, p.url, p.price, p.old_price, p.reference_price,
         p.discount_amount, p.discount_percent, p.in_stock, p.deal_since, p.category_slug,
         p.shop_category, s.slug AS shop_slug, s.name AS shop_name`;

function toDeal(r: Row): Deal {
  return {
    id: r.id,
    name: r.name,
    brand: r.brand,
    imageUrl: r.image_url,
    url: r.url,
    price: r.price,
    oldPrice: r.old_price,
    referencePrice: r.reference_price,
    discountAmount: r.discount_amount,
    discountPercent: r.discount_percent,
    inStock: r.in_stock,
    dealSince: r.deal_since ? new Date(r.deal_since).toISOString() : null,
    categorySlug: r.category_slug,
    shopCategory: r.shop_category,
    shopSlug: r.shop_slug,
    shopName: r.shop_name,
  };
}

const ORDER_BY: Record<SortKey, string> = {
  korting: "p.discount_percent DESC, p.discount_amount DESC, p.id DESC",
  besparing: "p.discount_amount DESC, p.discount_percent DESC, p.id DESC",
  nieuw: "p.deal_since DESC NULLS LAST, p.id DESC",
  "prijs-laag": "p.price ASC, p.id DESC",
  "prijs-hoog": "p.price DESC, p.id DESC",
};

export async function getDeals(
  filters: DealFilters,
): Promise<{ deals: Deal[]; total: number }> {
  await connection();
  const page = filters.page ?? 1;
  if (!isDbConfigured()) return filterDemo(filters);

  const where = ["p.is_deal", "s.enabled"];
  const params: unknown[] = [];
  const add = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (filters.category)
    where.push(`p.category_slug = ${add(filters.category)}`);
  if (filters.shop) where.push(`s.slug = ${add(filters.shop)}`);
  if (filters.minDiscount)
    where.push(`p.discount_percent >= ${add(filters.minDiscount)}`);
  if (filters.minPrice) where.push(`p.price >= ${add(filters.minPrice)}`);
  if (filters.maxPrice) where.push(`p.price <= ${add(filters.maxPrice)}`);
  if (filters.inStock) where.push("p.in_stock IS NOT FALSE");
  for (const term of searchTerms(filters.q)) {
    const t = add(`%${term}%`);
    where.push(`(p.name ILIKE ${t} OR p.brand ILIKE ${t} OR p.sku ILIKE ${t})`);
  }
  const limit = add(PAGE_SIZE);
  const offset = add((page - 1) * PAGE_SIZE);
  const rows = await query<Row>(
    `${SELECT}, COUNT(*) OVER() AS total
     FROM products p JOIN shops s ON s.id = p.shop_id
     WHERE ${where.join(" AND ")}
     ORDER BY ${ORDER_BY[filters.sort ?? "korting"]}
     LIMIT ${limit} OFFSET ${offset}`,
    params,
  );
  return { deals: rows.map(toDeal), total: rows[0]?.total ?? 0 };
}

function searchTerms(q?: string) {
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
    const rows = await query<Row>(
      `SELECT * FROM (
         ${SELECT}, ROW_NUMBER() OVER (PARTITION BY p.shop_id ORDER BY p.discount_percent DESC) AS rn
         FROM products p JOIN shops s ON s.id = p.shop_id
         WHERE p.is_deal AND s.enabled AND p.in_stock IS NOT FALSE AND p.image_url IS NOT NULL
       ) t WHERE rn <= 4 ORDER BY discount_percent DESC LIMIT $1`,
      [limit],
    );
    return rows.map(toDeal);
  });
}

export async function getNewestDeals(limit = 12): Promise<Deal[]> {
  await connection();
  if (!isDbConfigured())
    return filterDemo({ sort: "nieuw" }).deals.slice(0, limit);
  return cached(`newest:${limit}`, 60_000, async () => {
    const rows = await query<Row>(
      `${SELECT} FROM products p JOIN shops s ON s.id = p.shop_id
       WHERE p.is_deal AND s.enabled AND p.image_url IS NOT NULL
       ORDER BY p.deal_since DESC NULLS LAST, p.discount_percent DESC LIMIT $1`,
      [limit],
    );
    return rows.map(toDeal);
  });
}

export async function getDeal(id: number): Promise<Deal | null> {
  await connection();
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  if (!isDbConfigured()) return demoDeals().find((d) => d.id === id) ?? null;
  const rows = await query<Row>(
    `${SELECT} FROM products p JOIN shops s ON s.id = p.shop_id WHERE p.id = $1`,
    [id],
  );
  return rows[0] ? toDeal(rows[0]) : null;
}

export type PricePoint = {
  date: string;
  price: number;
  oldPrice: number | null;
};

export async function getPriceHistory(id: number): Promise<PricePoint[]> {
  await connection();
  if (!isDbConfigured()) return demoHistory(id);
  const rows = await query<{
    observed_at: Date;
    price: number;
    old_price: number | null;
  }>(
    `SELECT observed_at, price, old_price FROM price_history
     WHERE product_id = $1 ORDER BY observed_at ASC LIMIT 500`,
    [id],
  );
  return rows.map((r) => ({
    date: new Date(r.observed_at).toISOString(),
    price: r.price,
    oldPrice: r.old_price,
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
    const [totals] = await query<{
      deals: number;
      products: number;
      max_discount: number | null;
      savings: number | null;
      last_update: Date | null;
    }>(
      `SELECT COUNT(*) FILTER (WHERE p.is_deal) AS deals, COUNT(*) AS products,
              MAX(p.discount_percent) FILTER (WHERE p.is_deal) AS max_discount,
              SUM(p.discount_amount) FILTER (WHERE p.is_deal) AS savings,
              MAX(p.updated_at) AS last_update
       FROM products p JOIN shops s ON s.id = p.shop_id WHERE s.enabled`,
    );
    const cats = await query<{ category_slug: string; n: number }>(
      `SELECT category_slug, COUNT(*) AS n FROM products p JOIN shops s ON s.id = p.shop_id
       WHERE p.is_deal AND s.enabled GROUP BY 1`,
    );
    const shops = await query<{ slug: string; n: number }>(
      `SELECT s.slug, COUNT(p.id) FILTER (WHERE p.is_deal) AS n FROM shops s
       LEFT JOIN products p ON p.shop_id = s.id WHERE s.enabled GROUP BY 1`,
    );
    return {
      deals: totals?.deals ?? 0,
      products: totals?.products ?? 0,
      shops: shops.length || SHOPS.length,
      maxDiscount: Math.round(totals?.max_discount ?? 0),
      totalSavings: totals?.savings ?? 0,
      lastUpdate: totals?.last_update
        ? new Date(totals.last_update).toISOString()
        : null,
      byCategory: Object.fromEntries(cats.map((c) => [c.category_slug, c.n])),
      byShop: Object.fromEntries(shops.map((s) => [s.slug, s.n])),
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
