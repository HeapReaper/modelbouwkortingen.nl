/**
 * Bots, crawlers, linkvoorbeelden en scripts herkennen aan de user-agent. Gebruikt om ze niet
 * als klik of paginaweergave te tellen (/api/uit/[id], /api/bezoek) en om voor hen niets nieuw te
 * laten vertalen (dat kost geld, zie src/lib/translate.ts). Niet waterdicht: een bot kan zich als
 * browser voordoen.
 */
const BOT_RE =
  /bot|crawl|spider|slurp|preview|scanner|monitor|curl|wget|python|headless|facebookexternalhit|embedly|whatsapp|telegram|lighthouse|go-http-client|okhttp|axios|node-fetch|undici|java\/|libwww|httpclient|scrapy|phantomjs|^node$|mediapartners|google-|apis-google|feedfetcher|yandex|perplexity|anthropic|claude-|cohere-ai|ia_archiver|archive\.org|validator|pingdom|uptime|statuscake|pagespeed|gtmetrix|puppeteer|playwright|selenium/i;

/** Zonder user-agent is het vrijwel nooit een mens. */
export function isBot(userAgent: string | null | undefined) {
  return !userAgent || BOT_RE.test(userAgent);
}
