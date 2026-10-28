import "server-only";

import { createClient } from "redis";

/**
 * Cache voor databaseresultaten (deals op de homepage, statistieken, onderhoudsmodus,
 * zoekresultaten, ...).
 *
 *   - Met REDIS_URL staat alles in Redis: gedeeld door alle serverprocessen (ook de proxy), het
 *     overleeft een herstart, en forget() werkt overal tegelijk. Redis zelf houdt het geheugen in
 *     de hand (maxmemory + allkeys-lru, zie docker-compose.yml).
 *   - Zonder REDIS_URL (lokaal, demo) een cache in het geheugen van dit proces.
 *
 * Waarden gaan als JSON naar Redis: alleen gewone objecten, arrays, tekst, getallen en booleans
 * (geen Date, BigInt of Prisma Decimal). Is Redis onbereikbaar of traag, dan halen we de waarde
 * gewoon uit de database; een request wacht nooit langer dan REDIS_TIMEOUT_MS op Redis.
 */

/** Verandert de vorm van een gecachete waarde, verhoog dan dit nummer: oude sleutels tellen dan niet meer. */
const PREFIX = "mbk:v1:";
const REDIS_TIMEOUT_MS = 300;

function connect(url: string) {
  let down = false;
  const client = createClient({
    url,
    // Niet bufferen zolang de verbinding weg is: dan direct een fout en dus de database.
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 2_000,
      reconnectStrategy: (retries) => Math.min(retries * 500, 10_000),
    },
  });
  client.on("error", (err) => {
    // Tijdens het opnieuw verbinden komt dezelfde fout steeds terug: één keer melden.
    if (!down) console.error("[cache] Redis niet bereikbaar", err.message);
    down = true;
  });
  client.on("ready", () => {
    if (down) console.info("[cache] Redis weer bereikbaar");
    down = false;
  });
  client.connect().catch(() => {});
  return client;
}

type Redis = ReturnType<typeof connect>;

const globalForRedis = globalThis as unknown as { redis?: Redis };

/** De Redis-client als die verbonden is, anders null (dan slaan we Redis over). */
function redis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  globalForRedis.redis ??= connect(url);
  return globalForRedis.redis.isReady ? globalForRedis.redis : null;
}

function withTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Redis-timeout")), REDIS_TIMEOUT_MS),
    ),
  ]);
}

/** Lopende berekeningen per sleutel, zodat gelijktijdige requests de database één keer raken. */
const inflight = new Map<string, Promise<unknown>>();

function redisGet<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const k = PREFIX + key;
  const pending = inflight.get(k);
  if (pending) return pending as Promise<T>;
  const value = (async () => {
    const client = redis();
    if (client) {
      const hit = await withTimeout(client.get(k)).catch(() => null);
      if (hit !== null) return JSON.parse(hit) as T;
    }
    const fresh = await fn();
    if (client) {
      withTimeout(
        client.set(k, JSON.stringify(fresh), {
          expiration: { type: "PX", value: ttlMs },
        }),
      ).catch(() => {});
    }
    return fresh;
  })().finally(() => inflight.delete(k));
  inflight.set(k, value);
  return value;
}

/**
 * In-memory cache met een vaste geldigheid per waarde en hooguit `maxEntries` waarden: daarboven
 * gaat eerst wat verlopen is weg en dan wat het langst niet gebruikt is. Per serverproces.
 */
function createMemoryCache(maxEntries: number) {
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

const shared = createMemoryCache(500);
// Zoekresultaten zijn groot (tot een paar duizend aanbiedingen): daar passen er maar weinig van
// in het geheugen.
const search = createMemoryCache(30);

/** Kleine cache zodat drukke pagina's niet elke request de database raken. */
export function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  return process.env.REDIS_URL
    ? redisGet(key, ttlMs, fn)
    : shared.get(key, ttlMs, fn);
}

/** Cache voor de zoekresultaten van de prijsvergelijker en partfinder. */
export function searchCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  return process.env.REDIS_URL
    ? redisGet(`search:${key}`, ttlMs, fn)
    : search.get(key, ttlMs, fn);
}

/** Gooit een cached() waarde weg, bv. na een wijziging in het adminpanel. */
export function forget(key: string) {
  shared.forget(key);
  const client = redis();
  if (client) withTimeout(client.del(PREFIX + key)).catch(() => {});
}
