/**
 * Bots, crawlers, linkvoorbeelden en scripts herkennen aan de user-agent. Gebruikt om ze niet
 * als klik te tellen (/api/uit/[id]) en om voor hen niets nieuw te laten vertalen (dat kost geld,
 * zie src/lib/translate.ts). Niet waterdicht: een bot kan zich als browser voordoen.
 */
const BOT_RE =
  /bot|crawl|spider|slurp|preview|scanner|monitor|curl|wget|python|headless|facebookexternalhit|embedly|whatsapp|telegram|lighthouse|go-http-client|okhttp|axios|node-fetch|undici|java\/|libwww|httpclient|scrapy|phantomjs|^node$/i;

/** Zonder user-agent is het vrijwel nooit een mens. */
export function isBot(userAgent: string | null | undefined) {
  return !userAgent || BOT_RE.test(userAgent);
}
