import type { StaticImageData } from "next/image";
import berlinskiLogo from "@/assets/shops/berlinski.svg";
import droneshopLogo from "@/assets/shops/droneshop.png";
import hackerLogo from "@/assets/shops/hacker.png";
import hoelleinLogo from "@/assets/shops/hoellein.png";
import mgmodellbauLogo from "@/assets/shops/mgmodellbau.png";
import minizshopLogo from "@/assets/shops/minizshop.svg";
import rcmotorsportsLogo from "@/assets/shops/rcmotorsports.png";
import toemenLogo from "@/assets/shops/toemen.png";
import toprcLogo from "@/assets/shops/toprc.svg";
import wetronicLogo from "@/assets/shops/wetronic.png";

export type ShopInfo = {
  slug: string;
  name: string;
  url: string;
  domain: string;
  description: string;
  /** Logo zoals de webshop het zelf op zijn site gebruikt. */
  logo: StaticImageData;
  /** Achtergrond waarop het logo goed leesbaar is (TopRC en Wetronic zijn licht). */
  logoBg: string;
};

// Houd de slugs gelijk met crawler/internal/shops/*.go.
export const SHOPS: ShopInfo[] = [
  {
    slug: "toprc",
    name: "TopRC",
    url: "https://www.toprc.nl",
    domain: "toprc.nl",
    description:
      "Grote RC-specialist met auto's, helicopters, vliegtuigen, boten en onderdelen.",
    logo: toprcLogo,
    logoBg: "bg-[#00607b]",
  },
  {
    slug: "toemen",
    name: "Toemen Modelsport",
    url: "https://www.toemen.nl",
    domain: "toemen.nl",
    description:
      "Modelsportwinkel in Oisterwijk met een enorm assortiment RC, occasions en onderdelen.",
    logo: toemenLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "wetronic",
    name: "Wetronic",
    url: "https://wetronic.nl",
    domain: "wetronic.nl",
    description:
      "Modelbouwspecialist met veel vliegtuigen, zenders, elektronica en onderdelen.",
    logo: wetronicLogo,
    logoBg: "bg-[#0b1530]",
  },
  {
    slug: "minizshop",
    name: "Mini-Zshop",
    url: "https://mini-zshop.nl",
    domain: "mini-zshop.nl",
    description:
      "Specialist in Kyosho Mini-Z en kleine RC-auto's, met veel onderdelen en Traxxas-parts.",
    logo: minizshopLogo,
    logoBg: "bg-[#800f0b]",
  },
  {
    slug: "berlinski",
    name: "Modellbau Berlinski",
    url: "https://www.modellbau-berlinski.de",
    domain: "modellbau-berlinski.de",
    description:
      "Grote Duitse modelbouwwinkel met RC-auto's, trucks, boten, vliegtuigen en veel onderdelen.",
    logo: berlinskiLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "hoellein",
    name: "Hoellein",
    url: "https://hoelleinshop.com",
    domain: "hoelleinshop.com",
    description:
      "Duitse modelvliegspecialist met motoren, regelaars, servo's, propellers en bouwmaterialen.",
    logo: hoelleinLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "mgmodellbau",
    name: "MG-Modellbau",
    url: "https://www.mg-modellbau.de",
    domain: "mg-modellbau.de",
    description:
      "Duitse modelbouwshop met veel zenders, ontvangers, elektronica en onderdelen.",
    logo: mgmodellbauLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "hacker",
    name: "Hacker Motor",
    url: "https://www.hacker-motor-shop.com",
    domain: "hacker-motor-shop.com",
    description:
      "Duitse fabrikant van brushless motoren, met eigen webshop voor motoren, regelaars, accu's en modellen.",
    logo: hackerLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
  {
    slug: "rcmotorsports",
    name: "RC Motorsports",
    url: "https://www.rcmotorsports.nl",
    domain: "rcmotorsports.nl",
    description:
      "RC-dealer in Nieuwerkerk aan den IJssel met o.a. Traxxas, Arrma, Axial en Tamiya, plus veel onderdelen.",
    logo: rcmotorsportsLogo,
    logoBg: "bg-[#191919]",
  },
  {
    slug: "droneshop",
    name: "Droneshop.nl",
    url: "https://droneshop.nl",
    domain: "droneshop.nl",
    description:
      "Dronespecialist met camera-, FPV- en racedrones, plus accu's, propellers en onderdelen.",
    logo: droneshopLogo,
    logoBg: "bg-white ring-1 ring-border",
  },
];

const bySlug = new Map(SHOPS.map((s) => [s.slug, s]));

export function getShop(slug: string | null | undefined): ShopInfo | undefined {
  return slug ? bySlug.get(slug) : undefined;
}
