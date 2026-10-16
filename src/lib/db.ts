import "server-only";

import { Pool, types } from "pg";

// NUMERIC (1700) en BIGINT/COUNT (20) als getal teruggeven in plaats van string.
types.setTypeParser(1700, (v) => Number.parseFloat(v));
types.setTypeParser(20, (v) => Number.parseInt(v, 10));

const globalForDb = globalThis as unknown as { pgPool?: Pool };

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is niet ingesteld");
  }
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return globalForDb.pgPool;
}

export async function query<T>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query(text, params);
  return res.rows as T[];
}

/** Kleine in-memory cache zodat drukke pagina's niet elke request de database raken. */
const memo = new Map<string, { expires: number; value: Promise<unknown> }>();

export function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = memo.get(key);
  if (hit && hit.expires > now) return hit.value as Promise<T>;
  const value = fn().catch((err) => {
    memo.delete(key);
    throw err;
  });
  memo.set(key, { expires: now + ttlMs, value });
  if (memo.size > 500) {
    for (const [k, v] of memo) if (v.expires <= now) memo.delete(k);
  }
  return value;
}
