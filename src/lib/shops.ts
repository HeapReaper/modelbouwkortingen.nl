import type { StaticImageData } from "next/image";
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
];

const bySlug = new Map(SHOPS.map((s) => [s.slug, s]));

export function getShop(slug: string | null | undefined): ShopInfo | undefined {
  return slug ? bySlug.get(slug) : undefined;
}
