import type { StaticImageData } from "next/image";
import aeroberticsLogo from "@/assets/shops/aerobertics.png";
import area51Logo from "@/assets/shops/area51.png";
import berlinskiLogo from "@/assets/shops/berlinski.svg";
import bliekLogo from "@/assets/shops/bliek.png";
import chinahobbylineLogo from "@/assets/shops/chinahobbyline.png";
import droneshopLogo from "@/assets/shops/droneshop.png";
import hackerLogo from "@/assets/shops/hacker.png";
import heligearLogo from "@/assets/shops/heligear.png";
import hepfLogo from "@/assets/shops/hepf.svg";
import hoelleinLogo from "@/assets/shops/hoellein.png";
import mgmodellbauLogo from "@/assets/shops/mgmodellbau.png";
import minizshopLogo from "@/assets/shops/minizshop.svg";
import rcmotorsportsLogo from "@/assets/shops/rcmotorsports.png";
import tamicoLogo from "@/assets/shops/tamico.png";
import toemenLogo from "@/assets/shops/toemen.png";
import toprcLogo from "@/assets/shops/toprc.svg";
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
  },
  {
    slug: "toemen",
    name: "Toemen Modelsport",
    url: "https://www.toemen.nl",
    domain: "toemen.nl",
    logo: toemenLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "wetronic",
    name: "Wetronic",
    url: "https://wetronic.nl",
    domain: "wetronic.nl",
    logo: wetronicLogo,
    logoBg: "bg-[#0b1530]",
  },
  {
    slug: "minizshop",
    name: "Mini-Zshop",
    url: "https://mini-zshop.nl",
    domain: "mini-zshop.nl",
    logo: minizshopLogo,
    logoBg: "bg-[#800f0b]",
  },
  {
    slug: "berlinski",
    name: "Modellbau Berlinski",
    url: "https://www.modellbau-berlinski.de",
    domain: "modellbau-berlinski.de",
    logo: berlinskiLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "hoellein",
    name: "Hoellein",
    url: "https://hoelleinshop.com",
    domain: "hoelleinshop.com",
    logo: hoelleinLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "mgmodellbau",
    name: "MG-Modellbau",
    url: "https://www.mg-modellbau.de",
    domain: "mg-modellbau.de",
    logo: mgmodellbauLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "hacker",
    name: "Hacker Motor",
    url: "https://www.hacker-motor-shop.com",
    domain: "hacker-motor-shop.com",
    logo: hackerLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "rcmotorsports",
    name: "RC Motorsports",
    url: "https://www.rcmotorsports.nl",
    domain: "rcmotorsports.nl",
    logo: rcmotorsportsLogo,
    logoBg: "bg-[#191919]",
  },
  {
    slug: "droneshop",
    name: "Droneshop.nl",
    url: "https://droneshop.nl",
    domain: "droneshop.nl",
    logo: droneshopLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "tamico",
    name: "Tamico",
    url: "https://tamico.de",
    domain: "tamico.de",
    logo: tamicoLogo,
    logoBg: "bg-white ring-1 ring-border",
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
  },
  {
    slug: "bliek",
    name: "Bliek Modelbouw",
    url: "https://webshop.bliekmodelbouw.nl",
    domain: "bliekmodelbouw.nl",
    logo: bliekLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "aerobertics",
    name: "Aerobertics",
    url: "https://aerobertics.be/nl",
    domain: "aerobertics.be",
    logo: aeroberticsLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "heligear",
    name: "Heligear",
    url: "https://www.heligear.nl",
    domain: "heligear.nl",
    logo: heligearLogo,
    logoBg: "bg-[#1e1e1e]",
  },
  {
    slug: "area51",
    name: "Area51 RC",
    url: "https://www.area51-rc.es/shop/en/",
    domain: "area51-rc.es",
    logo: area51Logo,
    logoBg: "bg-[#212121]",
  },
];

const bySlug = new Map(SHOPS.map((s) => [s.slug, s]));

export function getShop(slug: string | null | undefined): ShopInfo | undefined {
  return slug ? bySlug.get(slug) : undefined;
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
