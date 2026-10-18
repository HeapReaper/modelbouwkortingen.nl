import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { getPrisma, num } from "@/lib/db";
import { postWebhook } from "@/lib/discord";
import { SITE_URL } from "@/lib/newsletter-mail";

/**
 * Bewaking van de crawler: ziet een ronde opvallend minder producten dan de vorige rondes van
 * die shop, dan heeft de webshop waarschijnlijk zijn HTML omgegooid en vindt de parser niets
 * meer. Zo'n ronde krijgt een rij in crawl_alerts (zichtbaar in /admin) en, als
 * ALERT_DISCORD_WEBHOOK is ingesteld, een bericht in dat Discord-kanaal.
 *
 * Minder producten is op zich normaal als een ronde kort na de vorige start (bv. na een
 * deploy): productpagina's die de crawler minder dan CRAWLER_RECRAWL_AFTER geleden bezocht,
 * slaat hij over. Daarom telt een geslaagde ronde alleen als hij niets vond, of als hij genoeg
 * pagina's ophaalde (MIN_PAGES) en daarop per pagina opvallend minder producten vond. Een
 * mislukte ronde telt altijd.
 */

/** Melden als een ronde minder dan dit deel van het mediaan van de vorige rondes zag. */
const DROP_RATIO = Number(process.env.CRAWL_ALERT_RATIO ?? 0.5);
/** Zoveel vorige geslaagde rondes vormen de basislijn. */
const BASELINE_RUNS = 5;
/** Kleine shops schommelen te veel om op te letten. */
const MIN_BASELINE = 50;
/**
 * Een kleine ronde (alleen de paar pagina's die aan de beurt waren) zegt te weinig over de
 * parser; een kapotte parser valt dan in de volgende grote ronde op.
 */
const MIN_PAGES = 100;
/** Alleen recente rondes bekijken; oudere zijn al beoordeeld. */
const LOOKBACK_MS = 48 * 60 * 60_000;

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export type CrawlCheckResult = {
  checked: number;
  alerts: number;
  notified: number;
};

export async function checkCrawlRuns(): Promise<CrawlCheckResult> {
  const prisma = getPrisma();
  const runs = await prisma.crawlRun.findMany({
    where: {
      status: { in: ["ok", "failed"] },
      finishedAt: { not: null },
      startedAt: { gte: new Date(Date.now() - LOOKBACK_MS) },
      alert: null,
    },
    select: {
      id: true,
      shopId: true,
      startedAt: true,
      status: true,
      productsSeen: true,
      pagesFetched: true,
    },
    orderBy: { startedAt: "asc" },
  });

  let alerts = 0;
  for (const run of runs) {
    const previous = await prisma.crawlRun.findMany({
      where: {
        shopId: run.shopId,
        status: "ok",
        productsSeen: { gt: 0 },
        startedAt: { lt: run.startedAt },
      },
      select: { productsSeen: true, pagesFetched: true },
      orderBy: { startedAt: "desc" },
      take: BASELINE_RUNS,
    });
    if (previous.length < 2) continue;
    const baseline = Math.round(median(previous.map((r) => r.productsSeen)));
    if (baseline < MIN_BASELINE || run.productsSeen >= baseline * DROP_RATIO)
      continue;
    if (run.status === "ok") {
      // Niets opgehaald: alles was recent al bezocht.
      if (run.pagesFetched === 0) continue;
      if (run.productsSeen > 0) {
        if (run.pagesFetched < MIN_PAGES) continue;
        const perPage = (r: { productsSeen: number; pagesFetched: number }) =>
          r.productsSeen / Math.max(r.pagesFetched, 1);
        const baselinePerPage = median(previous.map(perPage));
        if (perPage(run) >= baselinePerPage * DROP_RATIO) continue;
      }
    }
    try {
      await prisma.crawlAlert.create({
        data: {
          runId: run.id,
          shopId: run.shopId,
          seen: run.productsSeen,
          baseline,
        },
      });
      alerts++;
    } catch (err) {
      // Een andere server was ons voor.
      if (
        !(
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        )
      )
        throw err;
    }
  }

  return { checked: runs.length, alerts, notified: await notify() };
}

/** Stuurt de nog niet gemelde waarschuwingen naar ALERT_DISCORD_WEBHOOK. */
async function notify(): Promise<number> {
  const webhook = process.env.ALERT_DISCORD_WEBHOOK;
  if (!webhook) return 0;
  const prisma = getPrisma();
  const pending = await prisma.crawlAlert.findMany({
    where: { notifiedAt: null },
    include: { run: { include: { shop: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" },
    take: 10,
  });
  let notified = 0;
  for (const a of pending) {
    const drop = Math.round((1 - a.seen / a.baseline) * 100);
    const result = await postWebhook(webhook, {
      embeds: [
        {
          title: `Crawler: ${a.run.shop.name} zag ${drop}% minder producten`,
          url: `${SITE_URL}/admin`,
          description: `Ronde #${num(a.runId)} (${a.run.status}) zag ${a.seen} producten, normaal ±${a.baseline}. Controleer of de parser nog werkt (\`go run ./cmd/parsecheck\`).${a.run.message ? `\n\nMelding: ${a.run.message.slice(0, 500)}` : ""}`,
          color: 0xf59e0b,
          timestamp: a.createdAt.toISOString(),
        },
      ],
    });
    if (!result.ok) {
      console.error(`[crawler] melding naar Discord mislukt: ${result.error}`);
      break;
    }
    await prisma.crawlAlert.update({
      where: { runId: a.runId },
      data: { notifiedAt: new Date() },
    });
    notified++;
  }
  return notified;
}

export type CrawlAlertRow = {
  runId: number;
  shop: string;
  seen: number;
  baseline: number;
  startedAt: string;
  status: string;
  notifiedAt: string | null;
};

/** Open meldingen (nog niet afgehandeld in /admin), nieuwste eerst. */
export async function getCrawlAlerts(limit = 10): Promise<CrawlAlertRow[]> {
  const rows = await getPrisma().crawlAlert.findMany({
    where: { resolvedAt: null },
    include: { run: { include: { shop: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((a) => ({
    runId: num(a.runId),
    shop: a.run.shop.name,
    seen: a.seen,
    baseline: a.baseline,
    startedAt: a.run.startedAt.toISOString(),
    status: a.run.status,
    notifiedAt: a.notifiedAt?.toISOString() ?? null,
  }));
}
