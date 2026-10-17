import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, LOCALES, localePath } from "@/i18n/config";
import { CATEGORIES } from "@/lib/categories";
import { SHOPS } from "@/lib/shops";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://modelbouwkortingen.nl";

/** Elke pagina in elke taal, met hreflang-alternatieven. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    ...[
      "/aanbiedingen",
      "/webshops",
      "/over",
      "/contact",
      "/nieuwsbrief",
      "/discord",
    ].map((path) => ({ path, priority: 0.8 })),
    ...CATEGORIES.map((c) => ({ path: `/categorie/${c.slug}`, priority: 0.7 })),
    ...SHOPS.map((s) => ({ path: `/webshops/${s.slug}`, priority: 0.6 })),
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
