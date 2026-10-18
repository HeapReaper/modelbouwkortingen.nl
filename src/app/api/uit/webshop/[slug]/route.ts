import { after, connection } from "next/server";
import { isBot } from "@/lib/bots";
import { getPrisma, isDbConfigured } from "@/lib/db";
import { SITE_URL } from "@/lib/newsletter-mail";
import { getShop, shopLink } from "@/lib/shops";

/**
 * "Naar de webshop" op een uitgelichte webshop: telt de klik (outbound_clicks zonder product,
 * source "featured") en stuurt door naar de homepage van de shop, met partnerparameters.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/uit/webshop/[slug]">,
) {
  await connection();
  const shop = getShop((await ctx.params).slug);
  if (!shop) return Response.redirect(`${SITE_URL}/`, 302);

  const ua = request.headers.get("user-agent") ?? "";
  if (isDbConfigured() && !isBot(ua)) {
    after(async () => {
      try {
        await getPrisma().outboundClick.create({
          data: { shop: { connect: { slug: shop.slug } }, source: "featured" },
        });
      } catch (err) {
        console.error("[klik] opslaan mislukt", err);
      }
    });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: shopLink(shop),
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "origin",
    },
  });
}
