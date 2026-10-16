export const SORT_OPTIONS = {
  korting: "Hoogste korting (%)",
  besparing: "Hoogste besparing (€)",
  nieuw: "Nieuwste deals",
  "prijs-laag": "Prijs laag → hoog",
  "prijs-hoog": "Prijs hoog → laag",
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;

export type DealFilters = {
  q?: string;
  category?: string;
  shop?: string;
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: SortKey;
  page?: number;
};

export const PAGE_SIZE = 24;

/** Zet de query-string van de URL om naar gevalideerde filters. */
export function parseFilters(
  sp: Record<string, string | string[] | undefined>,
): DealFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const num = (k: string) => {
    const v = Number(one(k)?.replace(",", "."));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  };
  const sort = one("sort");
  return {
    q: one("q")?.slice(0, 100),
    category: one("categorie"),
    shop: one("shop"),
    minDiscount: num("korting"),
    minPrice: num("min"),
    maxPrice: num("max"),
    inStock: one("voorraad") === "1" || undefined,
    sort: sort && sort in SORT_OPTIONS ? (sort as SortKey) : undefined,
    page: Math.max(1, Math.floor(num("pagina") ?? 1)),
  };
}

/** Filters terug naar query-parameters (Nederlandse namen in de URL). */
export function filtersToParams(f: DealFilters) {
  return {
    q: f.q,
    categorie: f.category,
    shop: f.shop,
    korting: f.minDiscount,
    min: f.minPrice,
    max: f.maxPrice,
    voorraad: f.inStock ? 1 : undefined,
    sort: f.sort,
  };
}
