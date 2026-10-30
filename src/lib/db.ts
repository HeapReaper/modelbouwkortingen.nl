import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForDb = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaUrl?: string;
  adminPrisma?: PrismaClient;
  adminPrismaUrl?: string;
};

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma(): PrismaClient {
  return client("prisma", "prismaUrl", {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
    connectionTimeoutMillis: 5_000,
  });
}

/**
 * Voor de zware tellingen van het adminpanel en /api/stats: een eigen, kleine pool. Die
 * queries lopen over hele tabellen; met de gewone pool namen ze alle verbindingen in beslag
 * en kregen bezoekers een timeout.
 */
export function getAdminPrisma(): PrismaClient {
  return client("adminPrisma", "adminPrismaUrl", {
    max: 2,
    connectionTimeoutMillis: 60_000,
  });
}

function client(
  key: "prisma" | "adminPrisma",
  urlKey: "prismaUrl" | "adminPrismaUrl",
  pool: { max: number; connectionTimeoutMillis: number },
): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is niet ingesteld");
  }
  // `next dev` herlaadt .env.local zonder de module-globals te resetten: bouw de
  // client opnieuw op als de URL veranderd is, anders blijft de oude URL in gebruik.
  const existing = globalForDb[key];
  if (existing && globalForDb[urlKey] !== url) {
    existing.$disconnect().catch(() => {});
    globalForDb[key] = undefined;
  }
  let prisma = globalForDb[key];
  if (!prisma) {
    globalForDb[urlKey] = url;
    prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: url,
        idleTimeoutMillis: 30_000,
        ...pool,
      }),
    });
    globalForDb[key] = prisma;
  }
  return prisma;
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
