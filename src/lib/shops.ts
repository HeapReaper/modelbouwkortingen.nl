export type ShopInfo = {
  slug: string;
  name: string;
  url: string;
  domain: string;
  description: string;
  /** Kleur voor het logo-blokje van de shop (achtergrond + tekst). */
  color: string;
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
    color: "bg-sky-600 text-white",
  },
  {
    slug: "toemen",
    name: "Toemen Modelsport",
    url: "https://www.toemen.nl",
    domain: "toemen.nl",
    description:
      "Modelsportwinkel in Oisterwijk met een enorm assortiment RC, occasions en onderdelen.",
    color: "bg-emerald-600 text-white",
  },
  {
    slug: "wetronic",
    name: "Wetronic",
    url: "https://wetronic.nl",
    domain: "wetronic.nl",
    description:
      "Modelbouwspecialist met veel vliegtuigen, zenders, elektronica en onderdelen.",
    color: "bg-violet-600 text-white",
  },
];

const bySlug = new Map(SHOPS.map((s) => [s.slug, s]));

export function getShop(slug: string | null | undefined): ShopInfo | undefined {
  return slug ? bySlug.get(slug) : undefined;
}

export function shopInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
