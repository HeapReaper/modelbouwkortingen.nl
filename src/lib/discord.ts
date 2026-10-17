import "server-only";

import { randomBytes } from "node:crypto";
import { getPrisma } from "@/lib/db";
import { type Deal, getDealsAfter } from "@/lib/deals";
import { formatEuro } from "@/lib/format";
import { SITE_URL } from "@/lib/newsletter-mail";
import { productLink } from "@/lib/shops";

/**
 * Discord-meldingen: abonnees geven een webhook-URL op en krijgen elke nieuwe deal als embed.
 * Discord staat per webhook ongeveer 5 berichten per 2 seconden toe en 10 embeds per bericht.
 */

// Alleen voor lokaal testen te overschrijven; in productie altijd discord.com.
const API_ORIGIN = process.env.DISCORD_API_ORIGIN ?? "https://discord.com";
const BRAND_COLOR = 0xd2161e; // --primary uit globals.css
const EMBEDS_PER_MESSAGE = 10;
/** Maximaal zoveel deals per abonnee per ronde (5 minuten); de rest volgt in de volgende ronde. */
const DEALS_PER_RUN = 50;

const WEBHOOK_RE =
  /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api\/(?:v\d+\/)?webhooks\/(\d{17,20})\/([\w-]{50,100})\/?$/;

/** Normaliseert een webhook-URL naar discord.com, of null als het geen Discord-webhook is. */
export function parseWebhookUrl(
  raw: string,
): { id: string; url: string } | null {
  const value = raw.trim();
  let m = WEBHOOK_RE.exec(value);
  if (
    !m &&
    API_ORIGIN !== "https://discord.com" &&
    value.startsWith(API_ORIGIN)
  ) {
    m = WEBHOOK_RE.exec(`https://discord.com${value.slice(API_ORIGIN.length)}`);
  }
  if (!m) return null;
  return { id: m[1], url: `${API_ORIGIN}/api/webhooks/${m[1]}/${m[2]}` };
}

type DiscordEmbed = {
  title: string;
  url?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  thumbnail?: { url: string };
  footer?: { text: string };
  timestamp?: string;
};

type PostResult =
  | { ok: true }
  | { ok: false; gone: boolean; retryAfterMs?: number; error: string };

async function postWebhook(
  url: string,
  body: { content?: string; embeds: DiscordEmbed[] },
): Promise<PostResult> {
  const res = await fetch(`${url}?wait=true`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      username: "Modelbouwkortingen.nl",
      avatar_url: `${SITE_URL}/discord-avatar.png`,
      allowed_mentions: { parse: [] },
      ...body,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (res.ok) return { ok: true };
  if (res.status === 429) {
    const data = (await res.json().catch(() => ({}))) as {
      retry_after?: number;
    };
    return {
      ok: false,
      gone: false,
      retryAfterMs: Math.ceil((data.retry_after ?? 5) * 1000),
      error: "rate limited",
    };
  }
  // 401/403/404: webhook verwijderd of token ongeldig; die komt niet meer terug.
  const gone = [401, 403, 404].includes(res.status);
  return { ok: false, gone, error: `HTTP ${res.status}` };
}

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

export function dealEmbed(deal: Deal): DiscordEmbed {
  const fields = [
    { name: "Prijs", value: formatEuro(deal.price), inline: true },
    ...(deal.referencePrice
      ? [{ name: "Was", value: formatEuro(deal.referencePrice), inline: true }]
      : []),
    {
      name: "Korting",
      value: `-${Math.round(deal.discountPercent)}% (${formatEuro(deal.discountAmount)})`,
      inline: true,
    },
  ];
  return {
    title: truncate(deal.name, 256),
    url: productLink(deal).href,
    description: `Bij **${deal.shopName}** · [Prijsverloop](${SITE_URL}/product/${deal.id})`,
    color: BRAND_COLOR,
    fields,
    ...(deal.imageUrl?.startsWith("http")
      ? { thumbnail: { url: deal.imageUrl } }
      : {}),
    footer: { text: "Modelbouwkortingen.nl" },
    ...(deal.dealSince ? { timestamp: deal.dealSince } : {}),
  };
}

export type SubscribeResult =
  | { ok: true; name: string | null }
  | { ok: false; error: string };

/** Koppelt een webhook (of zet een eerder afgemelde weer aan) en stuurt een welkomstbericht. */
export async function subscribeWebhook(raw: string): Promise<SubscribeResult> {
  const parsed = parseWebhookUrl(raw);
  if (!parsed) {
    return {
      ok: false,
      error:
        "Dit is geen Discord-webhook-URL. Die begint met https://discord.com/api/webhooks/…",
    };
  }
  // Bestaat de webhook? Discord geeft met het token de naam en het kanaal terug.
  const res = await fetch(parsed.url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    return {
      ok: false,
      error:
        "Discord kent deze webhook niet. Controleer of je de hele URL hebt gekopieerd.",
    };
  }
  const info = (await res.json()) as {
    name?: string;
    guild_id?: string;
    channel_id?: string;
  };

  const prisma = getPrisma();
  const data = {
    webhookUrl: parsed.url,
    name: info.name ?? null,
    guildId: info.guild_id ?? null,
    channelId: info.channel_id ?? null,
    // Alleen deals vanaf nu, geen achterstand van vóór de aanmelding.
    cursorAt: new Date(),
    cursorProductId: BigInt(0),
    disabledAt: null,
    disabledReason: null,
  };
  const sub = await prisma.discordSubscriber.upsert({
    where: { webhookId: parsed.id },
    create: {
      webhookId: parsed.id,
      token: randomBytes(24).toString("base64url"),
      ...data,
    },
    update: data,
  });

  const unsubscribe = `${SITE_URL}/discord/afmelden?token=${encodeURIComponent(sub.token)}`;
  const welcome = await postWebhook(parsed.url, {
    embeds: [
      {
        title: "Gekoppeld met Modelbouwkortingen.nl",
        url: `${SITE_URL}/aanbiedingen?sort=nieuw`,
        description: `Vanaf nu verschijnt hier elke nieuwe RC-deal zodra we hem spotten.\n\nGeen meldingen meer? [Afmelden](${unsubscribe}) of verwijder de webhook in Discord.`,
        color: BRAND_COLOR,
        footer: { text: "Modelbouwkortingen.nl" },
      },
    ],
  });
  if (!welcome.ok) {
    await prisma.discordSubscriber.update({
      where: { id: sub.id },
      data: { disabledAt: new Date(), disabledReason: welcome.error },
    });
    return {
      ok: false,
      error:
        "We konden geen bericht in dit kanaal plaatsen. Probeer het later opnieuw.",
    };
  }
  return { ok: true, name: info.name ?? null };
}

export async function unsubscribeWebhook(token: string): Promise<boolean> {
  const { count } = await getPrisma().discordSubscriber.updateMany({
    where: { token, disabledAt: null },
    data: { disabledAt: new Date(), disabledReason: "afgemeld" },
  });
  return count > 0;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let running = false;

export type DiscordRunResult = {
  status: "ok" | "busy";
  subscribers?: number;
  posted?: number;
  disabled?: number;
};

/**
 * Post de nieuwe deals naar alle actieve webhooks. Elke abonnee heeft een eigen cursor; die
 * schuift pas op na een geslaagd bericht, dus bij een storing gaat er niets verloren.
 */
export async function postNewDeals(): Promise<DiscordRunResult> {
  if (running) return { status: "busy" };
  running = true;
  try {
    const prisma = getPrisma();
    const subs = await prisma.discordSubscriber.findMany({
      where: { disabledAt: null },
      orderBy: { id: "asc" },
    });
    let posted = 0;
    let disabled = 0;
    for (const sub of subs) {
      const deals = await getDealsAfter(
        sub.cursorAt,
        sub.cursorProductId,
        DEALS_PER_RUN,
      );
      for (let i = 0; i < deals.length; i += EMBEDS_PER_MESSAGE) {
        const batch = deals.slice(i, i + EMBEDS_PER_MESSAGE);
        let result = await postWebhook(sub.webhookUrl, {
          embeds: batch.map(dealEmbed),
        });
        if (!result.ok && result.retryAfterMs && result.retryAfterMs < 30_000) {
          await sleep(result.retryAfterMs);
          result = await postWebhook(sub.webhookUrl, {
            embeds: batch.map(dealEmbed),
          });
        }
        if (!result.ok) {
          if (result.gone) {
            disabled++;
            await prisma.discordSubscriber.update({
              where: { id: sub.id },
              data: { disabledAt: new Date(), disabledReason: result.error },
            });
          } else {
            console.error(
              `[discord] webhook ${sub.webhookId}: ${result.error}, volgende ronde opnieuw`,
            );
          }
          break;
        }
        const last = batch[batch.length - 1];
        await prisma.discordSubscriber.update({
          where: { id: sub.id },
          data: {
            cursorAt: new Date(last.dealSince ?? Date.now()),
            cursorProductId: BigInt(last.id),
            lastPostedAt: new Date(),
          },
        });
        posted += batch.length;
        // Ruim binnen de limiet van ~5 berichten per 2 seconden per webhook blijven.
        await sleep(500);
      }
    }
    if (posted > 0 || disabled > 0) {
      console.info(
        `[discord] ${posted} deals gepost naar ${subs.length} webhooks (${disabled} uitgezet)`,
      );
    }
    return { status: "ok", subscribers: subs.length, posted, disabled };
  } finally {
    running = false;
  }
}
