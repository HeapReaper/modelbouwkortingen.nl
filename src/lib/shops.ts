import type { StaticImageData } from "next/image";
import aeroberticsLogo from "@/assets/shops/aerobertics.png";
import area51Logo from "@/assets/shops/area51.png";
import banggoodLogo from "@/assets/shops/banggood.png";
import berlinskiLogo from "@/assets/shops/berlinski.svg";
import bliekLogo from "@/assets/shops/bliek.png";
import chinahobbylineLogo from "@/assets/shops/chinahobbyline.png";
import copterfarmLogo from "@/assets/shops/copterfarm.png";
import droneshopLogo from "@/assets/shops/droneshop.png";
import hackerLogo from "@/assets/shops/hacker.png";
import heligearLogo from "@/assets/shops/heligear.png";
import hepfLogo from "@/assets/shops/hepf.svg";
import hobbykingLogo from "@/assets/shops/hobbyking.svg";
import hoelleinLogo from "@/assets/shops/hoellein.png";
import lindingerLogo from "@/assets/shops/lindinger.svg";
import mgmodellbauLogo from "@/assets/shops/mgmodellbau.png";
import minizshopLogo from "@/assets/shops/minizshop.svg";
import nfactoryLogo from "@/assets/shops/nfactory.png";
import premiummodellbauLogo from "@/assets/shops/premiummodellbau.png";
import rccaronlineLogo from "@/assets/shops/rccaronline.png";
import rcmotorsportsLogo from "@/assets/shops/rcmotorsports.png";
import shopzinnigLogo from "@/assets/shops/shopzinnig.png";
import speelgoedenmodelbouwLogo from "@/assets/shops/speelgoedenmodelbouw.png";
import tamicoLogo from "@/assets/shops/tamico.png";
import theborderLogo from "@/assets/shops/theborder.png";
import toemenLogo from "@/assets/shops/toemen.png";
import toprcLogo from "@/assets/shops/toprc.svg";
import voltmasterLogo from "@/assets/shops/voltmaster.svg";
import wetronicLogo from "@/assets/shops/wetronic.png";

/** De omschrijving staat per taal in de woordenboeken (dict.shops[slug]). */
export type ShopInfo = {
  slug: string;
  name: string;
  url: string;
  domain: string;
  /** Logo zoals de webshop het zelf op zijn site gebruikt. */
  logo: StaticImageData;
  /** Achtergrond waarop het logo goed leesbaar is (TopRC en Wetronic zijn licht). */
  logoBg: string;
  /**
   * Affiliate-partnerschap: deze query-parameters komen op de link naar het product,
   * eventueel alleen voor producten in de genoemde categorieën.
   */
  affiliate?: { params: Record<string, string>; categories?: string[] };
  /** Land van de webshop (ISO 3166-1 alpha-2); leeg als dat niet eenduidig is. */
  country?: string;
  /** Taal van de productnamen op de site; "de" = namen worden vertaald (zie src/lib/translate.ts). */
  language?: "de";
  /**
   * Verzendkosten van een gewoon pakket naar Nederland, en vanaf welk orderbedrag verzending
   * gratis is. Alleen invullen als het op de site van de webshop zelf staat; zonder dit veld
   * tonen we geen verzendkosten of totaalprijs.
   */
  shipping?: { cost: number; freeFrom?: number };
};

// Houd de slugs gelijk met crawler/internal/shops/*.go.
export const SHOPS: ShopInfo[] = [
  {
    slug: "toprc",
    name: "TopRC",
    url: "https://www.toprc.nl",
    domain: "toprc.nl",
    logo: toprcLogo,
    logoBg: "bg-[#00607b]",
    country: "NL",
  },
  {
    slug: "toemen",
    name: "Toemen Modelsport",
    url: "https://www.toemen.nl",
    domain: "toemen.nl",
    logo: toemenLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "wetronic",
    name: "Wetronic",
    url: "https://wetronic.nl",
    domain: "wetronic.nl",
    logo: wetronicLogo,
    logoBg: "bg-[#0b1530]",
    country: "NL",
  },
  {
    slug: "minizshop",
    name: "Mini-Zshop",
    url: "https://mini-zshop.nl",
    domain: "mini-zshop.nl",
    logo: minizshopLogo,
    logoBg: "bg-[#800f0b]",
    country: "NL",
  },
  {
    slug: "berlinski",
    name: "Modellbau Berlinski",
    url: "https://www.modellbau-berlinski.de",
    domain: "modellbau-berlinski.de",
    logo: berlinskiLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "hoellein",
    name: "Hoellein",
    url: "https://hoelleinshop.com",
    domain: "hoelleinshop.com",
    logo: hoelleinLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "mgmodellbau",
    name: "MG-Modellbau",
    url: "https://www.mg-modellbau.de",
    domain: "mg-modellbau.de",
    logo: mgmodellbauLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "hacker",
    name: "Hacker Motor",
    url: "https://www.hacker-motor-shop.com",
    domain: "hacker-motor-shop.com",
    logo: hackerLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "rcmotorsports",
    name: "RC Motorsports",
    url: "https://www.rcmotorsports.nl",
    domain: "rcmotorsports.nl",
    logo: rcmotorsportsLogo,
    logoBg: "bg-[#191919]",
    country: "NL",
  },
  {
    slug: "droneshop",
    name: "Droneshop.nl",
    url: "https://droneshop.nl",
    domain: "droneshop.nl",
    logo: droneshopLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "tamico",
    name: "Tamico",
    url: "https://tamico.de",
    domain: "tamico.de",
    logo: tamicoLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "chinahobbyline",
    name: "ChinaHobbyLine",
    url: "https://chinahobbyline.com/nl",
    domain: "chinahobbyline.com",
    logo: chinahobbylineLogo,
    logoBg: "bg-white ring-1 ring-border",
    affiliate: { params: { ref: "rc-garage" }, categories: ["accus-laders"] },
  },
  {
    slug: "hepf",
    name: "Hepf",
    url: "https://hepf.com",
    domain: "hepf.com",
    logo: hepfLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "AT",
    language: "de",
  },
  {
    slug: "bliek",
    name: "Bliek Modelbouw",
    url: "https://webshop.bliekmodelbouw.nl",
    domain: "bliekmodelbouw.nl",
    logo: bliekLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "aerobertics",
    name: "Aerobertics",
    url: "https://aerobertics.be/nl",
    domain: "aerobertics.be",
    logo: aeroberticsLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "BE",
  },
  {
    slug: "heligear",
    name: "Heligear",
    url: "https://www.heligear.nl",
    domain: "heligear.nl",
    logo: heligearLogo,
    logoBg: "bg-[#1e1e1e]",
    country: "NL",
  },
  {
    slug: "area51",
    name: "Area51 RC",
    url: "https://www.area51-rc.es/shop/en/",
    domain: "area51-rc.es",
    logo: area51Logo,
    logoBg: "bg-[#212121]",
    country: "ES",
  },
  {
    slug: "banggood",
    name: "Banggood",
    url: "https://nl.banggood.com",
    domain: "banggood.com",
    logo: banggoodLogo,
    logoBg: "bg-[#1e1e1e]",
    // De prijzen zijn die van het Chinese magazijn (standaard op de productpagina).
    country: "CN",
    // Partnerlink: Banggood gebruikt ?p=<referral code> (account BG104716091).
    affiliate: { params: { p: "IM180966903162202610" } },
  },
  {
    slug: "voltmaster",
    name: "Voltmaster",
    url: "https://www.voltmaster.de",
    domain: "voltmaster.de",
    logo: voltmasterLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "nfactory",
    name: "N-Factory",
    url: "https://n-factory.de",
    domain: "n-factory.de",
    logo: nfactoryLogo,
    logoBg: "bg-[#1e1e1e]",
    country: "DE",
    language: "de",
  },
  {
    slug: "lindinger",
    name: "Lindinger",
    url: "https://www.lindinger.at",
    domain: "lindinger.at",
    logo: lindingerLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "AT",
    language: "de",
  },
  {
    slug: "rccaronline",
    name: "RC-Car-Online",
    url: "https://rc-car-online.de",
    domain: "rc-car-online.de",
    logo: rccaronlineLogo,
    logoBg: "bg-[#ffff00]",
    country: "DE",
    language: "de",
  },
  {
    slug: "premiummodellbau",
    name: "Premium-Modellbau",
    url: "https://www.premium-modellbau.de",
    domain: "premium-modellbau.de",
    logo: premiummodellbauLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "copterfarm",
    name: "CopterFarm",
    url: "https://www.copterfarm.de",
    domain: "copterfarm.de",
    logo: copterfarmLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "DE",
    language: "de",
  },
  {
    slug: "shopzinnig",
    name: "Shopzinnig",
    url: "https://www.shopzinnig.nl",
    domain: "shopzinnig.nl",
    logo: shopzinnigLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "hobbyking",
    name: "HobbyKing",
    url: "https://hobbyking.com/nl_nl/",
    domain: "hobbyking.com",
    logo: hobbykingLogo,
    logoBg: "bg-[#202020]",
    // De prijzen zijn die van het EU-magazijn in Frankrijk (stock_id 7, zie de crawler).
    country: "FR",
  },
  {
    slug: "speelgoedenmodelbouw",
    name: "SPEELGOEDenMODELBOUW",
    url: "https://www.speelgoedenmodelbouw.com",
    domain: "speelgoedenmodelbouw.com",
    logo: speelgoedenmodelbouwLogo,
    logoBg: "bg-white ring-1 ring-border",
    country: "NL",
  },
  {
    slug: "theborder",
    name: "The Border RC",
    url: "https://www.the-border.com",
    domain: "the-border.com",
    logo: theborderLogo,
    logoBg: "bg-black",
    country: "NL",
  },
];

const bySlug = new Map(SHOPS.map((s) => [s.slug, s]));

export function getShop(slug: string | null | undefined): ShopInfo | undefined {
  return slug ? bySlug.get(slug) : undefined;
}

/** Webshops met Duitse productnamen. */
export const GERMAN_SHOPS = SHOPS.filter((s) => s.language === "de").map(
  (s) => s.slug,
);

/** Shops uit dit land tellen als "binnenland": geen douane, meestal snelle levering. */
export const HOME_COUNTRIES = ["NL", "BE"];

/** Verzendkosten naar Nederland voor dit bedrag, of null als we ze niet kennen. */
export function shippingCost(slug: string, price: number): number | null {
  const shipping = getShop(slug)?.shipping;
  if (!shipping) return null;
  return shipping.freeFrom !== undefined && price >= shipping.freeFrom
    ? 0
    : shipping.cost;
}

/** Waar een klik naar de webshop vandaan komt (voor de statistieken in /admin). */
export const CLICK_SOURCES = [
  "site",
  "mail",
  "discord",
  "alarm",
  "feed",
  /** Uitgelichte (betaalde) plaatsing, zie src/lib/promotions.ts. */
  "featured",
] as const;
export type ClickSource = (typeof CLICK_SOURCES)[number];

/**
 * Link naar de webshop via /api/uit/[id], dat de klik telt en doorstuurt naar productLink().
 * `origin` is nodig buiten de site (mail, Discord, feed), waar een relatieve link niet werkt.
 */
export function outLink(
  deal: { id: number; url: string; shopSlug: string; categorySlug: string },
  source: ClickSource = "site",
  origin = "",
): { href: string; rel: string } {
  const query = source === "site" ? "" : `?bron=${source}`;
  const { rel } = productLink(deal);
  return {
    href: `${origin}/api/uit/${deal.id}${query}`,
    rel: source === "featured" ? sponsoredRel(rel) : rel,
  };
}

/** Een betaalde plaatsing is altijd rel="sponsored", ook zonder affiliate-link. */
function sponsoredRel(rel: string) {
  return rel.includes("sponsored") ? rel : `${rel} sponsored`;
}

/** Link naar de homepage van een uitgelichte webshop via /api/uit/webshop/[slug] (telt de klik). */
export function shopOutLink(slug: string): { href: string; rel: string } {
  return {
    href: `/api/uit/webshop/${slug}?bron=featured`,
    rel: "noopener nofollow sponsored",
  };
}

/** Homepage van de webshop, met partnerparameters als die voor de hele shop gelden. */
export function shopLink(shop: ShopInfo): string {
  if (!shop.affiliate || shop.affiliate.categories) return shop.url;
  const url = new URL(shop.url);
  for (const [k, v] of Object.entries(shop.affiliate.params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

/**
 * Link en rel-attribuut voor "naar de webshop". Affiliate-links krijgen de partnerparameters
 * en rel="sponsored", zoals zoekmachines voor betaalde links vragen.
 */
export function productLink(deal: {
  url: string;
  shopSlug: string;
  categorySlug: string;
}): { href: string; rel: string } {
  const affiliate = getShop(deal.shopSlug)?.affiliate;
  if (
    !affiliate ||
    (affiliate.categories && !affiliate.categories.includes(deal.categorySlug))
  ) {
    return { href: deal.url, rel: "noopener nofollow" };
  }
  let url: URL;
  try {
    url = new URL(deal.url);
  } catch {
    return { href: deal.url, rel: "noopener nofollow" };
  }
  for (const [k, v] of Object.entries(affiliate.params)) {
    url.searchParams.set(k, v);
  }
  return { href: url.toString(), rel: "noopener nofollow sponsored" };
}
