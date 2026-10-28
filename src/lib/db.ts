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
