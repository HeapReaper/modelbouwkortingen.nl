import "server-only";

import { connection } from "next/server";
import { getPrisma, isDbConfigured } from "@/lib/db";
import { isMailConfigured, verifyMail } from "@/lib/mail";
import { checkTranslator, isTranslatorConfigured } from "@/lib/translate";

/**
 * Status van de externe diensten voor het adminpanel: database, SMTP en LibreTranslate
 * (echt geprobeerd), plus wat alleen ingesteld hoeft te zijn. Het panel ververst elke 15
 * seconden; daarom onthouden we de uitkomst CACHE_MS lang. "Opnieuw controleren" gooit die
 * uitkomst weg.
 */

/** ok = werkt, down = ingesteld maar kapot, off = niet ingesteld. */
export type ServiceState = "ok" | "down" | "off";

export type ServiceCheck = {
  key: string;
  name: string;
  state: ServiceState;
  detail: string;
  /** Hoe lang de controle duurde; alleen bij echte controles. */
  ms?: number;
};

export type ServiceStatus = { checkedAt: string; services: ServiceCheck[] };

const CACHE_MS = 5 * 60_000;
const TIMEOUT_MS = 10_000;

const globalForStatus = globalThis as unknown as {
  serviceStatus?: { at: number; value: Promise<ServiceStatus> };
};

function message(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

/** Voert `run` uit met een tijdslimiet en meet hoe lang het duurde. */
async function probe(
  key: string,
  name: string,
  run: () => Promise<string>,
): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const detail = await Promise.race([
      run(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`geen antwoord binnen ${TIMEOUT_MS / 1000}s`)),
          TIMEOUT_MS,
        ),
      ),
    ]);
    return { key, name, state: "ok", detail, ms: Date.now() - start };
  } catch (err) {
    return {
      key,
      name,
      state: "down",
      detail: message(err),
      ms: Date.now() - start,
    };
  }
}

const off = (key: string, name: string, detail: string): ServiceCheck => ({
  key,
  name,
  state: "off",
  detail,
});

async function checkAll(): Promise<ServiceStatus> {
  const services = await Promise.all([
    isDbConfigured()
      ? probe("db", "Database", async () => {
          await getPrisma().$queryRaw`SELECT 1`;
          return "Verbonden";
        })
      : off("db", "Database", "DATABASE_URL is niet ingesteld (demo-modus)"),
    isMailConfigured()
      ? probe("smtp", "SMTP (mail)", async () => {
          await verifyMail();
          return `Ingelogd op ${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? 587}`;
        })
      : off(
          "smtp",
          "SMTP (mail)",
          "SMTP_HOST en MAIL_FROM zijn niet ingesteld",
        ),
    isTranslatorConfigured()
      ? probe("translate", "LibreTranslate", async () => {
          const text = await checkTranslator();
          return `"Test" → "${text}" (${process.env.LIBRETRANSLATE_URL})`;
        })
      : off(
          "translate",
          "LibreTranslate",
          "LIBRETRANSLATE_URL is niet ingesteld",
        ),
    process.env.ALERT_DISCORD_WEBHOOK
      ? {
          key: "alerts",
          name: "Crawlermeldingen (Discord)",
          state: "ok" as const,
          detail: "Webhook ingesteld",
        }
      : off(
          "alerts",
          "Crawlermeldingen (Discord)",
          "ALERT_DISCORD_WEBHOOK is niet ingesteld; meldingen alleen hier",
        ),
    process.env.NEWSLETTER_SCHEDULER === "off"
      ? off(
          "planner",
          "Planner",
          "NEWSLETTER_SCHEDULER=off: mail, Discord, prijsalarmen en vertalingen via een externe cron",
        )
      : {
          key: "planner",
          name: "Planner",
          state: "ok" as const,
          detail: "Draait elke 5 minuten in dit serverproces",
        },
  ]);
  return { checkedAt: new Date().toISOString(), services };
}

export async function getServiceStatus(): Promise<ServiceStatus> {
  await connection();
  const cached = globalForStatus.serviceStatus;
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;
  const value = checkAll();
  globalForStatus.serviceStatus = { at: Date.now(), value };
  return value;
}

/** Volgende keer opnieuw controleren. */
export function forgetServiceStatus() {
  globalForStatus.serviceStatus = undefined;
}
