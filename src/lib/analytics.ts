import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { connection } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma, isDbConfigured } from "@/lib/db";
import { dateOnly, todayNL } from "@/lib/promotions";

/**
 * Eigen bezoekersstatistieken: paginaweergaven van mensen (bots filtert /api/bezoek eruit), zonder
 * cookies en zonder IP-adressen op te slaan. Een bezoeker is alleen binnen één (Nederlandse) dag
 * herkenbaar: visitor = hash(zout van die dag + IP + user-agent), en het zout van gisteren wordt
 * gewist. "Bezoekers" over een week of maand is daarom de som van de unieke bezoekers per dag.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** Ruim een jaar, zodat de maandgrafiek altijd 12 volle maanden heeft. */
const RETENTION_DAYS = 400;

export type PageViewInput = {
  path: string;
  lang: string;
  referrer: string | null;
  entry: boolean;
  device: string;
  ip: string;
  userAgent: string;
};

export async function recordPageView(v: PageViewInput) {
  const salt = await dailySalt(todayNL());
  const visitor = createHash("sha256")
    .update(`${salt}|${v.ip}|${v.userAgent}`)
    .digest("base64url")
    .slice(0, 22);
  await getPrisma().pageView.create({
    data: {
      path: v.path,
      lang: v.lang,
      referrer: v.referrer,
      entry: v.entry,
      device: v.device,
      visitor,
    },
  });
}

let current: { day: string; salt: Promise<string> } | undefined;

function dailySalt(day: string): Promise<string> {
  if (current?.day !== day) {
    const salt = loadSalt(day);
    current = { day, salt };
    salt.catch(() => {
      if (current?.day === day) current = undefined;
    });
  }
  return current.salt;
}

/** Zout van vandaag uit de database (gedeeld door alle serverprocessen); ruimt bij een nieuwe dag op. */
async function loadSalt(day: string): Promise<string> {
  const prisma = getPrisma();
  const row = await prisma.analyticsSalt
    .upsert({
      where: { day },
      create: { day, salt: randomBytes(32).toString("hex") },
      update: {},
    })
    // Twee processen tegelijk: de ander was net eerder.
    .catch(() => prisma.analyticsSalt.findUniqueOrThrow({ where: { day } }));
  try {
    await Promise.all([
      prisma.analyticsSalt.deleteMany({ where: { day: { lt: day } } }),
      prisma.pageView.deleteMany({
        where: {
          createdAt: { lt: new Date(Date.now() - RETENTION_DAYS * DAY_MS) },
        },
      }),
    ]);
  } catch (err) {
    console.error("[statistieken] opruimen mislukt", err);
  }
  return row.salt;
}

/** "Mozilla/5.0 (iPhone; ...)" → mobile | tablet | desktop. */
export function deviceType(userAgent: string): string {
  if (/ipad|tablet|kindle|silk|android(?!.*mobile)/i.test(userAgent)) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|android|phone/i.test(userAgent)) return "mobile";
  return "desktop";
}

export type AnalyticsPoint = { key: string; views: number; visitors: number };
export type AnalyticsTotals = { views: number; visitors: number };

export type Analytics = {
  today: AnalyticsTotals;
  yesterday: AnalyticsTotals;
  last7: AnalyticsTotals;
  last30: AnalyticsTotals;
  /** Unieke bezoekers in de laatste 5 minuten. */
  activeNow: number;
  daily: AnalyticsPoint[];
  weekly: AnalyticsPoint[];
  monthly: AnalyticsPoint[];
  topPages: {
    path: string;
    title: string | null;
    today: number;
    last7: number;
    last30: number;
    visitors: number;
  }[];
  /** Binnenkomsten van buitenaf in 30 dagen; referrer null = direct (getypt, bladwijzer, app). */
  referrers: { referrer: string | null; visits: number }[];
  langs: { lang: string; views: number }[];
  devices: { device: string; views: number }[];
};

/** null zonder (bereikbare) database. */
export async function getAnalytics(): Promise<Analytics | null> {
  await connection();
  if (!isDbConfigured()) return null;
  try {
    return await loadAnalytics();
  } catch (err) {
    console.error("[statistieken] laden mislukt", err);
    return null;
  }
}

// Begin van vandaag en van 7 en 30 dagen terug (inclusief vandaag), in Nederlandse tijd.
const PERIODS = Prisma.raw(`
  WITH d AS (SELECT (now() AT TIME ZONE 'Europe/Amsterdam')::date AS today),
  t AS (
    SELECT today::timestamp AT TIME ZONE 'Europe/Amsterdam' AS d1,
           (today - 6)::timestamp AT TIME ZONE 'Europe/Amsterdam' AS d7,
           (today - 29)::timestamp AT TIME ZONE 'Europe/Amsterdam' AS d30
    FROM d
  )`);

async function loadAnalytics(): Promise<Analytics> {
  const prisma = getPrisma();
  const since = new Date(Date.now() - RETENTION_DAYS * DAY_MS);
  const [perDay, [active], pages, referrers, langs, devices] =
    await Promise.all([
      prisma.$queryRaw<{ day: string; views: number; visitors: number }[]>`
        SELECT to_char((created_at AT TIME ZONE 'Europe/Amsterdam')::date, 'YYYY-MM-DD') AS day,
               count(*)::int AS views, count(DISTINCT visitor)::int AS visitors
        FROM page_views WHERE created_at >= ${since}
        GROUP BY 1`,
      prisma.$queryRaw<{ n: number }[]>`
        SELECT count(DISTINCT visitor)::int AS n FROM page_views
        WHERE created_at > now() - interval '5 minutes'`,
      prisma.$queryRaw<
        {
          path: string;
          today: number;
          last7: number;
          last30: number;
          visitors: number;
        }[]
      >`${PERIODS}
        SELECT path,
               count(*) FILTER (WHERE created_at >= t.d1)::int AS today,
               count(*) FILTER (WHERE created_at >= t.d7)::int AS last7,
               count(*)::int AS last30,
               count(DISTINCT visitor)::int AS visitors
        FROM page_views, t WHERE created_at >= t.d30
        GROUP BY path ORDER BY last30 DESC, path LIMIT 25`,
      prisma.$queryRaw<{ referrer: string | null; visits: number }[]>`${PERIODS}
        SELECT referrer, count(*)::int AS visits
        FROM page_views, t WHERE created_at >= t.d30 AND entry
        GROUP BY referrer ORDER BY visits DESC LIMIT 15`,
      prisma.$queryRaw<{ lang: string; views: number }[]>`${PERIODS}
        SELECT lang, count(*)::int AS views FROM page_views, t WHERE created_at >= t.d30
        GROUP BY lang ORDER BY views DESC`,
      prisma.$queryRaw<{ device: string; views: number }[]>`${PERIODS}
        SELECT device, count(*)::int AS views FROM page_views, t WHERE created_at >= t.d30
        GROUP BY device ORDER BY views DESC`,
    ]);

  // Productpagina's met naam tonen.
  const productIds = pages.flatMap((p) => {
    const m = /^\/product\/(\d+)$/.exec(p.path);
    return m ? [BigInt(m[1])] : [];
  });
  const productNames = new Map(
    (productIds.length
      ? await prisma.product.findMany({
          select: { id: true, name: true },
          where: { id: { in: productIds } },
        })
      : []
    ).map((p) => [`/product/${p.id}`, p.name]),
  );

  const byDay = new Map(perDay.map((r) => [r.day, r]));
  const today = todayNL();
  const days = (n: number, from = today) =>
    Array.from({ length: n }, (_, i) => addDays(from, i - n + 1));
  const sum = (keys: string[]): AnalyticsTotals => {
    let views = 0;
    let visitors = 0;
    for (const k of keys) {
      views += byDay.get(k)?.views ?? 0;
      visitors += byDay.get(k)?.visitors ?? 0;
    }
    return { views, visitors };
  };
  const bucket = (keys: string[], keyOf: (day: string) => string) => {
    const out = new Map<string, AnalyticsPoint>(
      keys.map((key) => [key, { key, views: 0, visitors: 0 }]),
    );
    for (const r of perDay) {
      const p = out.get(keyOf(r.day));
      if (!p) continue;
      p.views += r.views;
      p.visitors += r.visitors;
    }
    return [...out.values()];
  };

  const thisMonday = monday(today);
  const weeks = Array.from({ length: 12 }, (_, i) =>
    addDays(thisMonday, (i - 11) * 7),
  );
  const [year, month] = today.split("-").map(Number);
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - 11 + i, 1));
    return d.toISOString().slice(0, 7);
  });

  return {
    today: sum([today]),
    yesterday: sum([addDays(today, -1)]),
    last7: sum(days(7)),
    last30: sum(days(30)),
    activeNow: active?.n ?? 0,
    daily: days(30).map((key) => ({
      key,
      views: byDay.get(key)?.views ?? 0,
      visitors: byDay.get(key)?.visitors ?? 0,
    })),
    weekly: bucket(weeks, monday),
    monthly: bucket(months, (day) => day.slice(0, 7)),
    topPages: pages.map((p) => ({
      ...p,
      title: productNames.get(p.path) ?? null,
    })),
    referrers,
    langs,
    devices,
  };
}

/** "2026-10-19" + n dagen → "YYYY-MM-DD". */
function addDays(day: string, n: number): string {
  return new Date(dateOnly(day).getTime() + n * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Maandag van de (ISO-)week van deze dag. */
function monday(day: string): string {
  return addDays(day, -((dateOnly(day).getUTCDay() + 6) % 7));
}
