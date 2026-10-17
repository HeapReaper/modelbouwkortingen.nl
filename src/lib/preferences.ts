import { CATEGORIES } from "@/lib/categories";
import { SHOPS } from "@/lib/shops";

/**
 * Voorkeuren van een abonnee (kortingsmail of Discord): alleen deals uit deze categorieën en
 * webshops (leeg = alles) met minstens zoveel procent korting.
 */
export type DealPreferences = {
  categories: string[];
  shops: string[];
  minDiscount: number;
};

export const NO_PREFERENCES: DealPreferences = {
  categories: [],
  shops: [],
  minDiscount: 0,
};

export const MIN_DISCOUNT_STEPS = [0, 10, 20, 30, 50];

export function matchesPreferences(
  deal: { categorySlug: string; shopSlug: string; discountPercent: number },
  prefs: DealPreferences,
) {
  return (
    (prefs.categories.length === 0 ||
      prefs.categories.includes(deal.categorySlug)) &&
    (prefs.shops.length === 0 || prefs.shops.includes(deal.shopSlug)) &&
    deal.discountPercent >= prefs.minDiscount
  );
}

/** Voorkeuren uit het formulier, alleen met bestaande categorieën en webshops. */
export function parsePreferences(formData: FormData): DealPreferences {
  const known = (values: FormDataEntryValue[], allowed: string[]) =>
    [...new Set(values.map(String))].filter((v) => allowed.includes(v));
  const categories = known(
    formData.getAll("categorie"),
    CATEGORIES.map((c) => c.slug),
  );
  const shops = known(
    formData.getAll("shop"),
    SHOPS.map((s) => s.slug),
  );
  const min = Number(formData.get("korting"));
  return {
    // Alles aangevinkt is hetzelfde als niets: dan komen nieuwe categorieën/shops ook mee.
    categories: categories.length === CATEGORIES.length ? [] : categories,
    shops: shops.length === SHOPS.length ? [] : shops,
    minDiscount: MIN_DISCOUNT_STEPS.includes(min) ? min : 0,
  };
}
