import "server-only";

import { connection } from "next/server";
import { cached } from "@/lib/cache";
import { getPrisma, isDbConfigured, num } from "@/lib/db";

/**
 * Cijfers over één webshop voor de webshoppagina, uit onze eigen crawl- en prijsdata. Datums als
 * ISO-tekst, zodat het in Redis past (zie src/lib/cache.ts).
 */
export type ShopStats = {
  products: number;
  /** Producten waarvan de webshop zegt dat ze op voorraad zijn (onbekend telt niet mee). */
  inStock: number;
  deals: number;
  avgDiscount: number;
  maxDiscount: number;
  /** Producten waarvan we de prijs in de afgelopen 24 uur opnieuw hebben opgehaald. */
  checked24h: number;
  lastChecked: string | null;
  /** Sinds wanneer we deze webshop volgen. */
  trackedSince: string;
  /** Prijsverlagingen in de afgelopen `dropDays` dagen (max. 30, korter als we de shop korter volgen). */
  priceDrops: number;
  dropDays: number;
  /** Categorieën met de meeste producten, met het aantal deals erin. */
  categories: { slug: string; products: number; deals: number }[];
};

const DAY_MS = 86_400_000;
const DROP_WINDOW_DAYS = 30;
const TOP_CATEGORIES = 6;

/** Cijfers van een ingeschakelde webshop, of null zonder database of bij een onbekende shop. */
export async function getShopStats(slug: string): Promise<ShopStats | null> {
  await connection();
  if (!isDbConfigured()) return null;
  return cached(`shop-stats:${slug}`, 30 * 60_000, async () => {
    const prisma = getPrisma();
    const shop = await prisma.shop.findUnique({
      where: { slug },
      select: { id: true, enabled: true, createdAt: true },
    });
    if (!shop?.enabled) return null;
    const visible = { shopId: shop.id, hidden: false };
    const deal = { ...visible, isDeal: true };
    const now = Date.now();
    const [all, inStock, deals, checked, cats, dealCats, drops] =
      await Promise.all([
        prisma.product.aggregate({
          where: visible,
          _count: true,
          _max: { lastCrawledAt: true },
        }),
        prisma.product.count({ where: { ...visible, inStock: true } }),
        prisma.product.aggregate({
          where: deal,
          _count: true,
          _avg: { discountPercent: true },
          _max: { discountPercent: true },
        }),
        prisma.product.count({
          where: { ...visible, lastCrawledAt: { gte: new Date(now - DAY_MS) } },
        }),
        prisma.product.groupBy({
          by: ["categorySlug"],
          where: visible,
          _count: true,
        }),
        prisma.product.groupBy({
          by: ["categorySlug"],
          where: deal,
          _count: true,
        }),
        // price_history krijgt alleen een regel als de prijs verandert; een lagere prijs dan de
        // vorige regel is een prijsverlaging. De vorige regel mag tot 60 dagen terug liggen.
        prisma.$queryRaw<{ drops: number }[]>`
          SELECT count(*)::int AS drops FROM (
            SELECT ph.price, ph.observed_at,
              lag(ph.price) OVER (PARTITION BY ph.product_id ORDER BY ph.observed_at) AS prev
            FROM price_history ph JOIN products p ON p.id = ph.product_id
            WHERE p.shop_id = ${shop.id} AND NOT p.hidden
              AND ph.observed_at >= now() - interval '60 days'
          ) t
          WHERE observed_at >= now() - interval '30 days' AND prev IS NOT NULL AND price < prev`,
      ]);
    const dealsIn = new Map(dealCats.map((c) => [c.categorySlug, c._count]));
    const trackedDays = Math.floor((now - shop.createdAt.getTime()) / DAY_MS);
    return {
      products: all._count,
      inStock,
      deals: deals._count,
      avgDiscount: Math.round(num(deals._avg.discountPercent) ?? 0),
      maxDiscount: Math.round(num(deals._max.discountPercent) ?? 0),
      checked24h: checked,
      lastChecked: all._max.lastCrawledAt?.toISOString() ?? null,
      trackedSince: shop.createdAt.toISOString(),
      priceDrops: drops[0]?.drops ?? 0,
      dropDays: Math.min(DROP_WINDOW_DAYS, Math.max(1, trackedDays)),
      categories: cats
        .sort((a, b) => b._count - a._count)
        .slice(0, TOP_CATEGORIES)
        .map((c) => ({
          slug: c.categorySlug,
          products: c._count,
          deals: dealsIn.get(c.categorySlug) ?? 0,
        })),
    };
  });
}
