import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, LOCALES, localePath } from "@/i18n/config";
import { CATEGORIES } from "@/lib/categories";
import { getBrands } from "@/lib/deals";
import { SHOPS } from "@/lib/shops";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://modelbouwkortingen.nl";

/** Zoveel merkpagina's (meeste deals eerst) in de sitemap. */
const MAX_BRANDS = 300;

/** Elke pagina in elke taal, met hreflang-alternatieven. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Merken komen uit de database; zonder (bv. tijdens de build) alleen de vaste pagina's.
  const brands = await getBrands().catch(() => []);
  const pages: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    ...[
      "/aanbiedingen",
      "/prijsvergelijker",
      "/partfinder",
      "/webshops",
      "/merken",
      "/over",
      "/contact",
      "/nieuwsbrief",
      "/discord",
    ].map((path) => ({ path, priority: 0.8 })),
    { path: "/privacy", priority: 0.3 },
    ...CATEGORIES.map((c) => ({ path: `/categorie/${c.slug}`, priority: 0.7 })),
    ...SHOPS.map((s) => ({ path: `/webshops/${s.slug}`, priority: 0.6 })),
    ...brands
      .slice(0, MAX_BRANDS)
      .map((b) => ({ path: `/merk/${b.slug}`, priority: 0.5 })),
  ];
  const languages = (path: string) => ({
    ...Object.fromEntries(
      LOCALES.map((l) => [l, siteUrl + localePath(l, path)]),
    ),
    "x-default": siteUrl + localePath(DEFAULT_LOCALE, path),
  });
  return pages.flatMap(({ path, priority }) =>
    LOCALES.map((lang) => ({
      url: siteUrl + localePath(lang, path),
      changeFrequency: "daily" as const,
      priority,
      alternates: { languages: languages(path) },
    })),
  );
}
