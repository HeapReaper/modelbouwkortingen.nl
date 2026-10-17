import "server-only";

import { connection } from "next/server";
import { getPrisma, isDbConfigured, num } from "@/lib/db";

export type ShopOverview = {
  slug: string;
  name: string;
  enabled: boolean;
  products: number;
  deals: number;
  avgDiscount: number | null;
  lastSeen: string | null;
  crawledLast24h: number;
};

export type CrawlRun = {
  id: number;
  shop: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  pagesFetched: number;
  productsSeen: number;
  dealsFound: number;
  errors: number;
  rateLimited: number;
  message: string | null;
};

export type DailyPoint = { day: string; newDeals: number; pages: number };

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  createdAt: string;
};

export type AdminOverview = {
  db: {
    ok: boolean;
    error?: string;
    sizeBytes?: number;
    priceHistoryRows?: number;
  };
  shops: ShopOverview[];
  runs: CrawlRun[];
  daily: DailyPoint[];
  categories: { slug: string; deals: number; products: number }[];
  messages: ContactMessage[];
  unhandledMessages: number;
};

const iso = (d: Date | null) => d?.toISOString() ?? null;

const DAY_MS = 24 * 60 * 60 * 1000;

/** De laatste n dagen (UTC), oudste eerst, als "YYYY-MM-DD". */
function lastDays(n: number): string[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) =>
    new Date(today.getTime() - (n - 1 - i) * DAY_MS).toISOString().slice(0, 10),
  );
}

export async function getAdminOverview(): Promise<AdminOverview> {
  await connection();
  const empty: AdminOverview = {
    db: { ok: false, error: "DATABASE_URL is niet ingesteld (demo-modus)" },
    shops: [],
    runs: [],
    daily: [],
    categories: [],
    messages: [],
    unhandledMessages: 0,
  };
  if (!isDbConfigured()) return empty;
  const prisma = getPrisma();
  const days = lastDays(14);
  const since = new Date(`${days[0]}T00:00:00Z`);
  try {
    const [
      shops,
      productsPerShop,
      dealsPerShop,
      crawledPerShop,
      runs,
      recentDeals,
      recentRuns,
      categories,
      dealsPerCategory,
      messages,
      priceHistoryRows,
      unhandledMessages,
      [size],
    ] = await Promise.all([
      prisma.shop.findMany({
        select: { id: true, slug: true, name: true, enabled: true },
        orderBy: { name: "asc" },
      }),
      prisma.product.groupBy({
        by: ["shopId"],
        _count: true,
        _max: { lastSeenAt: true },
      }),
      prisma.product.groupBy({
        by: ["shopId"],
        where: { isDeal: true },
        _count: true,
        _avg: { discountPercent: true },
      }),
      prisma.product.groupBy({
        by: ["shopId"],
        where: { lastCrawledAt: { gt: new Date(Date.now() - DAY_MS) } },
        _count: true,
      }),
      prisma.crawlRun.findMany({
        include: { shop: { select: { name: true } } },
        orderBy: { startedAt: "desc" },
        take: 25,
      }),
      prisma.product.findMany({
        select: { dealSince: true },
        where: { isDeal: true, dealSince: { gte: since } },
      }),
      prisma.crawlRun.findMany({
        select: { startedAt: true, pagesFetched: true },
        where: { startedAt: { gte: since } },
      }),
      prisma.category.findMany({
        select: { slug: true, _count: { select: { products: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.groupBy({
        by: ["categorySlug"],
        where: { isDeal: true },
        _count: true,
      }),
      prisma.contactMessage.findMany({
        orderBy: [{ handled: "asc" }, { createdAt: "desc" }],
        take: 30,
      }),
      prisma.priceHistory.count(),
      prisma.contactMessage.count({ where: { handled: false } }),
      // Geen ORM-equivalent voor de databasegrootte.
      prisma.$queryRaw<
        { size: bigint }[]
      >`SELECT pg_database_size(current_database()) AS size`,
    ]);

    const byShop = <T extends { shopId: number }>(rows: T[]) =>
      new Map(rows.map((r) => [r.shopId, r]));
    const products = byShop(productsPerShop);
    const deals = byShop(dealsPerShop);
    const crawled = byShop(crawledPerShop);
    const catDeals = new Map(
      dealsPerCategory.map((c) => [c.categorySlug, c._count]),
    );

    const newDeals = new Map<string, number>();
    for (const d of recentDeals) {
      const day = d.dealSince?.toISOString().slice(0, 10);
      if (day) newDeals.set(day, (newDeals.get(day) ?? 0) + 1);
    }
    const pages = new Map<string, number>();
    for (const r of recentRuns) {
      const day = r.startedAt.toISOString().slice(0, 10);
      pages.set(day, (pages.get(day) ?? 0) + r.pagesFetched);
    }

    return {
      db: {
        ok: true,
        sizeBytes: num(size?.size) ?? undefined,
        priceHistoryRows,
      },
      shops: shops.map((s) => {
        const avg = num(deals.get(s.id)?._avg.discountPercent);
        return {
          slug: s.slug,
          name: s.name,
          enabled: s.enabled,
          products: products.get(s.id)?._count ?? 0,
          deals: deals.get(s.id)?._count ?? 0,
          avgDiscount: avg === null ? null : Math.round(avg * 10) / 10,
          lastSeen: iso(products.get(s.id)?._max.lastSeenAt ?? null),
          crawledLast24h: crawled.get(s.id)?._count ?? 0,
        };
      }),
      runs: runs.map((r) => ({
        id: num(r.id),
        shop: r.shop.name,
        startedAt: r.startedAt.toISOString(),
        finishedAt: iso(r.finishedAt),
        status: r.status,
        pagesFetched: r.pagesFetched,
        productsSeen: r.productsSeen,
        dealsFound: r.dealsFound,
        errors: r.errors,
        rateLimited: r.rateLimited,
        message: r.message,
      })),
      daily: days.map((day) => ({
        day,
        newDeals: newDeals.get(day) ?? 0,
        pages: pages.get(day) ?? 0,
      })),
      categories: categories.map((c) => ({
        slug: c.slug,
        deals: catDeals.get(c.slug) ?? 0,
        products: c._count.products,
      })),
      messages: messages.map((m) => ({
        id: num(m.id),
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        handled: m.handled,
        createdAt: m.createdAt.toISOString(),
      })),
      unhandledMessages,
    };
  } catch (err) {
    return {
      ...empty,
      db: {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

/* ---------- live stats van de Go crawler ---------- */

export type CrawlerLive = {
  ok: boolean;
  error?: string;
  startedAt?: string;
  uptime?: string;
  shops?: {
    shop: string;
    phase: string;
    runStartedAt?: string;
    lastRunAt?: string;
    lastRunStatus?: string;
    queueTotal: number;
    queueDone: number;
    productsSeen: number;
    dealsFound: number;
    parseErrors: number;
    sitemapUrls: number;
  }[];
  hosts?: {
    host: string;
    requests: number;
    ok: number;
    errors: number;
    rateLimited: number;
    notFound: number;
    robotsBlocked: number;
    bytes: number;
    backoff: string;
    blockedUntil?: string;
    lastStatus: number;
    lastError?: string;
    lastRequestAt?: string;
    avgLatencyMs: number;
  }[];
};

export async function getCrawlerLive(): Promise<CrawlerLive> {
  await connection();
  const url = process.env.CRAWLER_STATS_URL;
  if (!url) return { ok: false, error: "CRAWLER_STATS_URL is niet ingesteld" };
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
      headers: process.env.CRAWLER_STATS_TOKEN
        ? { Authorization: `Bearer ${process.env.CRAWLER_STATS_TOKEN}` }
        : undefined,
    });
    if (!res.ok)
      return { ok: false, error: `Crawler antwoordde met HTTP ${res.status}` };
    return { ok: true, ...(await res.json()) };
  } catch (err) {
    return {
      ok: false,
      error: `Crawler niet bereikbaar: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
