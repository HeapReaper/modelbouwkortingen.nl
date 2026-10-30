import "server-only";

import { connection } from "next/server";
import { type CrawlAlertRow, getCrawlAlerts } from "@/lib/crawl-alerts";
import { getAdminPrisma, isDbConfigured, num } from "@/lib/db";

export type ShopOverview = {
  slug: string;
  name: string;
  enabled: boolean;
  products: number;
  deals: number;
  avgDiscount: number | null;
  lastSeen: string | null;
  crawledLast24h: number;
  /** Alle categorieën (in de volgorde van de site); hidden = bij deze shop niet op de site. */
  categories: ShopCategory[];
};

export type ShopCategory = {
  slug: string;
  products: number;
  deals: number;
  hidden: boolean;
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

export type ClickStats = {
  last7: number;
  last30: number;
  byShop: { slug: string; name: string; last7: number; last30: number }[];
  bySource: { source: string; clicks: number }[];
  topProducts: { id: number; name: string; shop: string; clicks: number }[];
};

export type AlertStats = {
  active: number;
  unconfirmed: number;
  sent30: number;
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
  clicks: ClickStats;
  crawlAlerts: CrawlAlertRow[];
  priceAlerts: AlertStats;
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
    clicks: { last7: 0, last30: 0, byShop: [], bySource: [], topProducts: [] },
    crawlAlerts: [],
    priceAlerts: { active: 0, unconfirmed: 0, sent30: 0 },
  };
  if (!isDbConfigured()) return empty;
  const prisma = getAdminPrisma();
  const days = lastDays(14);
  const since = new Date(`${days[0]}T00:00:00Z`);
  const ago7 = new Date(Date.now() - 7 * DAY_MS);
  const ago30 = new Date(Date.now() - 30 * DAY_MS);
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
      clicks7,
      clicks30,
      clickSources,
      clickProducts,
      crawlAlerts,
      alertsActive,
      alertsUnconfirmed,
      alertsSent30,
      productsPerShopCategory,
      dealsPerShopCategory,
      hiddenCategories,
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
      prisma.outboundClick.groupBy({
        by: ["shopId"],
        where: { createdAt: { gte: ago7 } },
        _count: true,
      }),
      prisma.outboundClick.groupBy({
        by: ["shopId"],
        where: { createdAt: { gte: ago30 } },
        _count: true,
      }),
      prisma.outboundClick.groupBy({
        by: ["source"],
        where: { createdAt: { gte: ago30 } },
        _count: true,
      }),
      prisma.outboundClick.groupBy({
        by: ["productId"],
        where: { createdAt: { gte: ago30 }, productId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { productId: "desc" } },
        take: 10,
      }),
      getCrawlAlerts(10),
      prisma.priceAlert.count({
        where: {
          confirmedAt: { not: null },
          triggeredAt: null,
          cancelledAt: null,
        },
      }),
      prisma.priceAlert.count({
        where: { confirmedAt: null, cancelledAt: null },
      }),
      prisma.priceAlert.count({ where: { triggeredAt: { gte: ago30 } } }),
      prisma.product.groupBy({
        by: ["shopId", "categorySlug"],
        _count: true,
      }),
      prisma.product.groupBy({
        by: ["shopId", "categorySlug"],
        where: { isDeal: true },
        _count: true,
      }),
      prisma.shopHiddenCategory.findMany({
        select: { shopId: true, categorySlug: true },
      }),
    ]);
    const topIds = clickProducts.flatMap((c) => c.productId ?? []);
    const topNames = new Map(
      (
        await prisma.product.findMany({
          select: { id: true, name: true, shop: { select: { name: true } } },
          where: { id: { in: topIds } },
        })
      ).map((p) => [p.id, p]),
    );
    const clicks7ByShop = new Map(clicks7.map((c) => [c.shopId, c._count]));
    const clicks30ByShop = new Map(clicks30.map((c) => [c.shopId, c._count]));

    const byShop = <T extends { shopId: number }>(rows: T[]) =>
      new Map(rows.map((r) => [r.shopId, r]));
    const products = byShop(productsPerShop);
    const deals = byShop(dealsPerShop);
    const crawled = byShop(crawledPerShop);
    const shopCat = (r: { shopId: number; categorySlug: string }) =>
      `${r.shopId}:${r.categorySlug}`;
    const shopCatProducts = new Map(
      productsPerShopCategory.map((r) => [shopCat(r), r._count]),
    );
    const shopCatDeals = new Map(
      dealsPerShopCategory.map((r) => [shopCat(r), r._count]),
    );
    const hidden = new Set(hiddenCategories.map(shopCat));
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
          categories: categories.map((c) => {
            const key = shopCat({ shopId: s.id, categorySlug: c.slug });
            return {
              slug: c.slug,
              products: shopCatProducts.get(key) ?? 0,
              deals: shopCatDeals.get(key) ?? 0,
              hidden: hidden.has(key),
            };
          }),
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
      clicks: {
        last7: clicks7.reduce((n, c) => n + c._count, 0),
        last30: clicks30.reduce((n, c) => n + c._count, 0),
        byShop: shops
          .map((s) => ({
            slug: s.slug,
            name: s.name,
            last7: clicks7ByShop.get(s.id) ?? 0,
            last30: clicks30ByShop.get(s.id) ?? 0,
          }))
          .filter((s) => s.last30 > 0)
          .sort((a, b) => b.last30 - a.last30),
        bySource: clickSources
          .map((c) => ({ source: c.source, clicks: c._count }))
          .sort((a, b) => b.clicks - a.clicks),
        topProducts: clickProducts.flatMap((c) => {
          const p = c.productId ? topNames.get(c.productId) : undefined;
          return p
            ? [
                {
                  id: num(p.id),
                  name: p.name,
                  shop: p.shop.name,
                  clicks: c._count._all,
                },
              ]
            : [];
        }),
      },
      crawlAlerts,
      priceAlerts: {
        active: alertsActive,
        unconfirmed: alertsUnconfirmed,
        sent30: alertsSent30,
      },
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

/** Eén logregel van de crawler (zie crawler/internal/logbuf). */
export type CrawlerLogEntry = {
  seq: number;
  time: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  msg: string;
  shop?: string;
  attrs?: Record<string, string>;
};

export type CrawlerLogFilter = {
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  shop: string;
  q: string;
  products: boolean;
  after: number;
};

export type CrawlerLogs =
  | { ok: true; entries: CrawlerLogEntry[]; latest: number }
  | { ok: false; error: string };

/**
 * De laatste logregels van de crawler, via GET /logs op dezelfde server als /stats
 * (CRAWLER_STATS_URL met /logs in plaats van /stats).
 */
export async function getCrawlerLogs(
  filter: CrawlerLogFilter,
): Promise<CrawlerLogs> {
  const statsUrl = process.env.CRAWLER_STATS_URL;
  if (!statsUrl)
    return { ok: false, error: "CRAWLER_STATS_URL is niet ingesteld" };
  const url = new URL("logs", statsUrl);
  url.searchParams.set("level", filter.level);
  if (filter.shop) url.searchParams.set("shop", filter.shop);
  if (filter.q) url.searchParams.set("q", filter.q);
  if (!filter.products) url.searchParams.set("products", "0");
  if (filter.after > 0) url.searchParams.set("after", String(filter.after));
  url.searchParams.set("limit", "500");
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: process.env.CRAWLER_STATS_TOKEN
        ? { Authorization: `Bearer ${process.env.CRAWLER_STATS_TOKEN}` }
        : undefined,
    });
    // Een crawler van vóór deze functie kent /logs nog niet.
    if (res.status === 404)
      return {
        ok: false,
        error:
          "Deze crawler-versie heeft nog geen /logs; deploy de crawler opnieuw",
      };
    if (!res.ok)
      return { ok: false, error: `Crawler antwoordde met HTTP ${res.status}` };
    const data = (await res.json()) as {
      entries: CrawlerLogEntry[] | null;
      latest: number;
    };
    return { ok: true, entries: data.entries ?? [], latest: data.latest };
  } catch (err) {
    return {
      ok: false,
      error: `Crawler niet bereikbaar: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Start meteen een crawl-ronde voor één shop, via POST /run op dezelfde server als /stats.
 * null = gestart, anders een foutmelding voor het admin panel.
 */
export async function startCrawl(shop: string): Promise<string | null> {
  const statsUrl = process.env.CRAWLER_STATS_URL;
  if (!statsUrl) return "CRAWLER_STATS_URL is niet ingesteld";
  const url = new URL("run", statsUrl);
  url.searchParams.set("shop", shop);
  try {
    const res = await fetch(url, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: process.env.CRAWLER_STATS_TOKEN
        ? { Authorization: `Bearer ${process.env.CRAWLER_STATS_TOKEN}` }
        : undefined,
    });
    if (res.ok) return null;
    if (res.status === 409) return "Er loopt al een ronde voor deze shop";
    // Een crawler van vóór deze functie kent POST /run nog niet (405/404).
    if (res.status === 405)
      return "Deze crawler-versie kan nog niet handmatig starten; deploy de crawler opnieuw";
    return (
      (await res.text()).trim() || `Crawler antwoordde met HTTP ${res.status}`
    );
  } catch (err) {
    return `Crawler niet bereikbaar: ${err instanceof Error ? err.message : String(err)}`;
  }
}
