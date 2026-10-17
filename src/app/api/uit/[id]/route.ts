import { after, connection } from "next/server";
import { getPrisma, isDbConfigured } from "@/lib/db";
import { getDeal } from "@/lib/deals";
import { SITE_URL } from "@/lib/newsletter-mail";
import { CLICK_SOURCES, type ClickSource, productLink } from "@/lib/shops";

/** Linkvoorbeelden, mailscanners en zoekmachines tellen niet als klik. */
const BOT_RE =
  /bot|crawl|spider|slurp|preview|scanner|monitor|curl|wget|python|headless|facebookexternalhit|embedly/i;

/**
 * "Naar de webshop": telt de klik (tabel outbound_clicks) en stuurt door naar het product,
 * met affiliate-parameters via productLink(). `?bron=` zegt waar de link stond (zie ClickSource).
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/uit/[id]">,
) {
  await connection();
  const deal = await getDeal(Number((await ctx.params).id));
  if (!deal) return Response.redirect(`${SITE_URL}/`, 302);

  const bron = new URL(request.url).searchParams.get("bron");
  const source: ClickSource = CLICK_SOURCES.includes(bron as ClickSource)
    ? (bron as ClickSource)
    : "site";
  const ua = request.headers.get("user-agent") ?? "";
  if (request.method === "GET" && isDbConfigured() && ua && !BOT_RE.test(ua)) {
    after(async () => {
      try {
        await getPrisma().outboundClick.create({
          data: {
            product: { connect: { id: BigInt(deal.id) } },
            shop: { connect: { slug: deal.shopSlug } },
            source,
          },
        });
      } catch (err) {
        console.error("[klik] opslaan mislukt", err);
      }
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: productLink(deal).href,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "origin",
    },
  });
}
