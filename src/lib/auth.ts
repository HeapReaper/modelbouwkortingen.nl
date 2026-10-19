import "server-only";

import {
  createHash,
  randomBytes,
  type ScryptOptions,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-shared";
import { getPrisma, isDbConfigured, num } from "@/lib/db";

/**
 * Accounts met e-mail + wachtwoord. Sessies staan in de database: de cookie bevat een
 * willekeurig token, de database alleen de SHA-256 ervan. Zo is een gelekte database geen
 * set werkende cookies, en kan uitloggen (of een wachtwoordreset) sessies echt intrekken.
 */

const SESSION_COOKIE = "mbk_sessie";
const SESSION_DAYS = 30;
const MAX_PASSWORD_LENGTH = 200;

// scrypt met N=2^15: ~50 ms per hash, 32 MiB geheugen.
const SCRYPT: ScryptOptions = {
  N: 2 ** 15,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};
const KEY_LENGTH = 32;

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, SCRYPT, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt);
  return `scrypt$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const key = await scryptAsync(password, Buffer.from(salt, "base64url"));
  return key.length === expected.length && timingSafeEqual(key, expected);
}

// Voor onbekende adressen toch een hash vergelijken, zodat de responstijd niet verraadt of
// er een account bestaat.
let dummyHash: Promise<string> | undefined;
export async function burnPasswordCheck(password: string) {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  await verifyPassword(password, await dummyHash);
}

/** Melding-sleutel bij een ongeldig wachtwoord, of null. */
export function passwordProblem(
  password: string,
): "passwordTooShort" | "passwordTooLong" | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "passwordTooShort";
  if (password.length > MAX_PASSWORD_LENGTH) return "passwordTooLong";
  return null;
}

export const newToken = () => randomBytes(32).toString("base64url");
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/** Maakt een sessie en zet de cookie (alleen in Server Actions of Route Handlers). */
export async function startSession(userId: bigint) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000);
  const prisma = getPrisma();
  // Verlopen sessies van deze gebruiker opruimen; zo groeit de tabel niet zonder planner.
  await prisma.userSession.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });
  await prisma.userSession.create({
    data: { id: tokenHash(token), userId, expiresAt },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Trekt de huidige sessie in en wist de cookie. */
export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && isDbConfigured()) {
    await getPrisma().userSession.deleteMany({
      where: { id: tokenHash(token) },
    });
  }
  store.delete(SESSION_COOKIE);
}

export type CurrentUser = { id: number; email: string };

/**
 * De ingelogde gebruiker, of null. Leest de cookie: alleen aanroepen binnen een
 * <Suspense>-grens of in een Server Action. Eén databasequery per request (React cache).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !isDbConfigured()) return null;
  const session = await getPrisma().userSession.findUnique({
    where: { id: tokenHash(token) },
    select: { expiresAt: true, user: { select: { id: true, email: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return { id: num(session.user.id), email: session.user.email };
});
