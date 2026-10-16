import "server-only";

import { connection } from "next/server";
import { isDbConfigured, query } from "@/lib/db";

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

const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);

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
  try {
    const [shops, runs, daily, categories, messages, meta] = await Promise.all([
      query<{
        slug: string;
        name: string;
        enabled: boolean;
        products: number;
        deals: number;
        avg_discount: number | null;
        last_seen: Date | null;
        crawled_24h: number;
      }>(`
        SELECT s.slug, s.name, s.enabled, COUNT(p.id) AS products,
               COUNT(p.id) FILTER (WHERE p.is_deal) AS deals,
               ROUND(AVG(p.discount_percent) FILTER (WHERE p.is_deal), 1) AS avg_discount,
               MAX(p.last_seen_at) AS last_seen,
               COUNT(p.id) FILTER (WHERE p.last_crawled_at > now() - interval '24 hours') AS crawled_24h
        FROM shops s LEFT JOIN products p ON p.shop_id = s.id
        GROUP BY s.id ORDER BY s.name`),
      query<{
        id: number;
        shop: string;
        started_at: Date;
        finished_at: Date | null;
        status: string;
        pages_fetched: number;
        products_seen: number;
        deals_found: number;
        errors: number;
        rate_limited: number;
        message: string | null;
      }>(`
        SELECT r.id, s.name AS shop, r.started_at, r.finished_at, r.status, r.pages_fetched,
               r.products_seen, r.deals_found, r.errors, r.rate_limited, r.message
        FROM crawl_runs r JOIN shops s ON s.id = r.shop_id
        ORDER BY r.started_at DESC LIMIT 25`),
      query<{ day: Date; new_deals: number; pages: number }>(`
        WITH days AS (
          SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') AS day
        )
        SELECT d.day,
          (SELECT COUNT(*) FROM products p WHERE p.is_deal AND date_trunc('day', p.deal_since) = d.day) AS new_deals,
          (SELECT COALESCE(SUM(pages_fetched), 0) FROM crawl_runs r WHERE date_trunc('day', r.started_at) = d.day) AS pages
        FROM days d ORDER BY d.day`),
      query<{ slug: string; deals: number; products: number }>(`
        SELECT c.slug, COUNT(p.id) FILTER (WHERE p.is_deal) AS deals, COUNT(p.id) AS products
        FROM categories c LEFT JOIN products p ON p.category_slug = c.slug
        GROUP BY c.slug, c.sort_order ORDER BY c.sort_order`),
      query<{
        id: number;
        name: string;
        email: string;
        subject: string;
        message: string;
        handled: boolean;
        created_at: Date;
      }>(`SELECT id, name, email, subject, message, handled, created_at FROM contact_messages
          ORDER BY handled ASC, created_at DESC LIMIT 30`),
      query<{ size: number; history: number; unhandled: number }>(`
        SELECT pg_database_size(current_database()) AS size,
               (SELECT COUNT(*) FROM price_history) AS history,
               (SELECT COUNT(*) FROM contact_messages WHERE NOT handled) AS unhandled`),
    ]);
    return {
      db: {
        ok: true,
        sizeBytes: meta[0]?.size,
        priceHistoryRows: meta[0]?.history,
      },
      shops: shops.map((s) => ({
        slug: s.slug,
        name: s.name,
        enabled: s.enabled,
        products: s.products,
        deals: s.deals,
        avgDiscount: s.avg_discount,
        lastSeen: iso(s.last_seen),
        crawledLast24h: s.crawled_24h,
      })),
      runs: runs.map((r) => ({
        id: r.id,
        shop: r.shop,
        startedAt: new Date(r.started_at).toISOString(),
        finishedAt: iso(r.finished_at),
        status: r.status,
        pagesFetched: r.pages_fetched,
        productsSeen: r.products_seen,
        dealsFound: r.deals_found,
        errors: r.errors,
        rateLimited: r.rate_limited,
        message: r.message,
      })),
      daily: daily.map((d) => ({
        day: new Date(d.day).toISOString().slice(0, 10),
        newDeals: d.new_deals,
        pages: d.pages,
      })),
      categories,
      messages: messages.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        handled: m.handled,
        createdAt: new Date(m.created_at).toISOString(),
      })),
      unhandledMessages: meta[0]?.unhandled ?? 0,
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
