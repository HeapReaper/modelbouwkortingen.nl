import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForDb = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaUrl?: string;
};

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is niet ingesteld");
  }
  // `next dev` herlaadt .env.local zonder de module-globals te resetten: bouw de
  // client opnieuw op als de URL veranderd is, anders blijft de oude URL in gebruik.
  if (globalForDb.prisma && globalForDb.prismaUrl !== url) {
    globalForDb.prisma.$disconnect().catch(() => {});
    globalForDb.prisma = undefined;
  }
  if (!globalForDb.prisma) {
    globalForDb.prismaUrl = url;
    globalForDb.prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: url,
        max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }),
    });
  }
  return globalForDb.prisma;
}

/** Decimal/BigInt uit Prisma naar een gewoon getal (bedragen en tellingen passen ruim). */
export function num(v: { toString(): string } | number | bigint): number;
export function num(
  v: { toString(): string } | number | bigint | null | undefined,
): number | null;
export function num(
  v: { toString(): string } | number | bigint | null | undefined,
): number | null {
  if (v === null || v === undefined) return null;
  return typeof v === "number" ? v : Number(v.toString());
}

/**
 * In-memory cache met een vaste geldigheid per waarde en hooguit `maxEntries` waarden: daarboven
 * gaat eerst wat verlopen is weg en dan wat het langst niet gebruikt is. Per serverproces.
 */
function createCache(maxEntries: number) {
  const memo = new Map<string, { expires: number; value: Promise<unknown> }>();
  function get<T>(
    key: string,
    ttlMs: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const now = Date.now();
    const hit = memo.get(key);
    if (hit && hit.expires > now) {
      // Achteraan zetten: Map houdt de volgorde van invoegen aan, dus vooraan staat het oudste.
      memo.delete(key);
      memo.set(key, hit);
      return hit.value as Promise<T>;
    }
    const value = fn().catch((err) => {
      memo.delete(key);
      throw err;
    });
    memo.delete(key);
    memo.set(key, { expires: now + ttlMs, value });
    if (memo.size > maxEntries) {
      for (const [k, v] of memo) if (v.expires <= now) memo.delete(k);
      for (const k of memo.keys()) {
        if (memo.size <= maxEntries) break;
        memo.delete(k);
      }
    }
    return value;
  }
  return { get, forget: (key: string) => memo.delete(key) };
}

/** Kleine in-memory cache zodat drukke pagina's niet elke request de database raken. */
const shared = createCache(500);
export const cached = shared.get;

/**
 * Aparte cache voor zoekresultaten van de prijsvergelijker en partfinder: die zijn groot (tot een
 * paar duizend aanbiedingen), dus er passen er maar weinig in.
 */
export const searchCache = createCache(30).get;

/** Gooit een cached() waarde weg, bv. na een wijziging in het adminpanel. */
export function forget(key: string) {
  shared.forget(key);
}
