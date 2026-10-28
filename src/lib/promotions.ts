import "server-only";

import { connection } from "next/server";
import { cached, forget } from "@/lib/cache";
import { getPrisma, isDbConfigured, num } from "@/lib/db";
import { type Deal, getDealsByIds } from "@/lib/deals";
import { SHOPS, type ShopInfo } from "@/lib/shops";

/**
 * Uitgelichte webshops en producten: betaalde plaatsingen uit de tabel promotions, beheerd
 * in het adminpanel. Een promotie zonder product licht de webshop uit, met product dat ene
 * product. Op de site staan ze altijd met het label "Gesponsord", en kliks erop tellen met
 * source "featured" (zie outLink()), zodat we per promotie kunnen rapporteren.
 */

const CACHE_KEY = "promotions";
const CACHE_MS = 60_000;
const TIME_ZONE = "Europe/Amsterdam";

/** Vandaag in Nederland als YYYY-MM-DD (de kolommen starts_on/ends_on zijn een DATE). */
export function todayNL(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: TIME_ZONE });
}

/** "2026-10-19" → Date op middernacht UTC, zoals Prisma een DATE-kolom leest en schrijft. */
export function dateOnly(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

type Active = { shopSlugs: string[]; productIds: number[] };
const NONE: Active = { shopSlugs: [], productIds: [] };

/** Promoties die vandaag lopen, van ingeschakelde shops; nieuwste eerst. */
function getActive(): Promise<Active> {
  if (!isDbConfigured()) return Promise.resolve(NONE);
  return cached(CACHE_KEY, CACHE_MS, async () => {
    const today = dateOnly(todayNL());
    const rows = await getPrisma().promotion.findMany({
      select: { productId: true, shop: { select: { slug: true } } },
      where: {
        enabled: true,
        startsOn: { lte: today },
        OR: [{ endsOn: null }, { endsOn: { gte: today } }],
        shop: { enabled: true },
      },
      orderBy: { id: "desc" },
    });
    return {
      shopSlugs: [
        ...new Set(rows.flatMap((r) => (r.productId ? [] : [r.shop.slug]))),
      ],
      productIds: [
        ...new Set(
          rows.flatMap((r) => (r.productId ? [num(r.productId)] : [])),
        ),
      ],
    };
  });
}

/** Een databasefout mag de pagina niet breken: dan tonen we gewoon niets uitgelicht. */
async function safeActive(): Promise<Active> {
  await connection();
  try {
    return await getActive();
  } catch (err) {
    console.error("[promoties] laden mislukt", err);
    return NONE;
  }
}

/** Uitgelichte webshops (alleen shops die we kennen in SHOPS). */
export async function getFeaturedShops(): Promise<ShopInfo[]> {
  const { shopSlugs } = await safeActive();
  return shopSlugs.flatMap((slug) => SHOPS.find((s) => s.slug === slug) ?? []);
}

/** Slugs van de uitgelichte webshops, om ze in een lijst vooraan te zetten. */
export async function getFeaturedShopSlugs(): Promise<Set<string>> {
  return new Set((await safeActive()).shopSlugs);
}

/**
 * Uitgelichte producten, eventueel alleen uit één categorie of webshop. Producten die
 * uitverkocht zijn slaan we over: een adverteerder wil daar geen kliks op.
 */
export async function getFeaturedDeals(
  opts: { category?: string; shop?: string; limit?: number } = {},
): Promise<Deal[]> {
  const { productIds } = await safeActive();
  if (productIds.length === 0) return [];
  const deals = await getDealsByIds(productIds);
  return deals
    .filter(
      (d) =>
        d.inStock !== false &&
        (!opts.category || d.categorySlug === opts.category) &&
        (!opts.shop || d.shopSlug === opts.shop),
    )
    .slice(0, opts.limit ?? 12);
}

export function forgetPromotions() {
  forget(CACHE_KEY);
}

// ── Adminpanel ──────────────────────────────────────────────────────────────

export type PromotionStatus = "active" | "scheduled" | "ended" | "off";

export type AdminPromotion = {
  id: number;
  shopSlug: string;
  shopName: string;
  /** outOfStock: uitverkocht, dus nu niet zichtbaar op de site (zie getFeaturedDeals()). */
  product: { id: number; name: string; outOfStock: boolean } | null;
  startsOn: string;
  endsOn: string | null;
  enabled: boolean;
  note: string;
  status: PromotionStatus;
  /** Kliks met source "featured" binnen de looptijd (tot vandaag). */
  clicks: number;
};

export async function listPromotions(): Promise<AdminPromotion[]> {
  const prisma = getPrisma();
  const today = todayNL();
  const rows = await prisma.promotion.findMany({
    include: {
      shop: { select: { id: true, slug: true, name: true } },
      product: { select: { id: true, name: true, inStock: true } },
    },
    orderBy: [{ startsOn: "desc" }, { id: "desc" }],
    take: 200,
  });
  const day = (d: Date) => d.toISOString().slice(0, 10);
  return Promise.all(
    rows.map(async (r) => {
      const startsOn = day(r.startsOn);
      const endsOn = r.endsOn ? day(r.endsOn) : null;
      const status: PromotionStatus = !r.enabled
        ? "off"
        : startsOn > today
          ? "scheduled"
          : endsOn && endsOn < today
            ? "ended"
            : "active";
      // De looptijd in Nederlandse dagen, dus tot en met ends_on 23:59 in Amsterdam.
      const clicks =
        status === "scheduled"
          ? 0
          : await countClicks(
              r.shopId,
              r.productId,
              startsOn,
              endsOn && endsOn < today ? endsOn : today,
            );
      return {
        id: r.id,
        shopSlug: r.shop.slug,
        shopName: r.shop.name,
        product: r.product
          ? {
              id: num(r.product.id),
              name: r.product.name,
              outOfStock: r.product.inStock === false,
            }
          : null,
        startsOn,
        endsOn,
        enabled: r.enabled,
        note: r.note,
        status,
        clicks,
      };
    }),
  );
}

async function countClicks(
  shopId: number,
  productId: bigint | null,
  from: string,
  to: string,
): Promise<number> {
  const [row] = await getPrisma().$queryRaw<{ n: bigint }[]>`
    SELECT count(*) AS n FROM outbound_clicks
    WHERE source = 'featured'
      AND shop_id = ${shopId}
      AND product_id IS NOT DISTINCT FROM ${productId}
      AND created_at >= (${from}::date::timestamp AT TIME ZONE ${TIME_ZONE})
      AND created_at < ((${to}::date + 1)::timestamp AT TIME ZONE ${TIME_ZONE})`;
  return num(row?.n ?? 0);
}
