import { connection } from "next/server";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/translate";
import { getCategory } from "@/lib/categories";
import { getBrand, getDeals } from "@/lib/deals";
import { formatters } from "@/lib/format";
import { SITE_URL, siteUrl } from "@/lib/newsletter-mail";
import { getShop, outLink } from "@/lib/shops";

/**
 * RSS 2.0-feed met de nieuwste deals, voor feedlezers en koppelingen (Telegram-bots, ntfy,
 * IFTTT, …). Filters: ?categorie=, ?shop=, ?merk= (slug) en ?lang=nl|en|de.
 * Staat buiten app/[lang] (vaste URL /feed.xml; de proxy slaat paden met een extensie over).
 */

const ITEMS = 50;

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function GET(request: Request) {
  await connection();
  const sp = new URL(request.url).searchParams;
  const langParam = sp.get("lang");
  const lang = hasLocale(langParam) ? langParam : DEFAULT_LOCALE;
  const dict = getDictionary(lang);
  const f = dict.feed;
  const fmt = formatters(lang);

  const category = getCategory(sp.get("categorie") ?? "")?.slug;
  const shop = getShop(sp.get("shop"));
  const brand = sp.get("merk") ? await getBrand(sp.get("merk") ?? "") : null;
  const { deals } = await getDeals(
    {
      category,
      shop: shop?.slug,
      brands: brand?.variants,
      sort: "nieuw",
    },
    ITEMS,
  );

  const subject = [
    category ? dict.categories[category]?.name : null,
    brand?.name,
    shop?.name,
  ]
    .filter(Boolean)
    .join(" · ");
  const title = subject ? t(f.titleFiltered, { subject }) : f.title;
  const self = `${SITE_URL}/feed.xml${sp.size > 0 ? `?${sp}` : ""}`;

  const items = deals
    .map((d) => {
      const page = siteUrl(lang, `/product/${d.id}`);
      const description = t(f.item, {
        price: fmt.euro(d.price),
        shop: d.shopName,
        was: d.referencePrice ? fmt.euro(d.referencePrice) : "—",
        percent: Math.round(d.discountPercent),
      });
      const html = `${d.imageUrl ? `<p><img src="${esc(d.imageUrl)}" alt="" width="240"></p>` : ""}<p>${esc(description)}</p><p><a href="${esc(outLink(d, "feed", SITE_URL).href)}">${esc(t(f.toShop, { shop: d.shopName }))}</a></p>`;
      return `<item>
<title>${esc(`-${Math.round(d.discountPercent)}% ${d.name}`)}</title>
<link>${esc(page)}</link>
<guid isPermaLink="false">mbk-${d.id}-${d.dealSince ? new Date(d.dealSince).getTime() : 0}</guid>
${d.dealSince ? `<pubDate>${new Date(d.dealSince).toUTCString()}</pubDate>` : ""}
<category>${esc(dict.categories[d.categorySlug]?.name ?? d.categorySlug)}</category>
<description>${esc(html)}</description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(`${title} | Modelbouwkortingen.nl`)}</title>
<link>${esc(siteUrl(lang, "/aanbiedingen?sort=nieuw"))}</link>
<description>${esc(f.description)}</description>
<language>${lang}</language>
<atom:link href="${esc(self)}" rel="self" type="application/rss+xml"/>
<ttl>30</ttl>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
