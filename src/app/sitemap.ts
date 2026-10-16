import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { SHOPS } from "@/lib/shops";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://modelbouwkortingen.nl";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/aanbiedingen", "/webshops", "/over", "/contact"];
  return [
    ...pages.map((p) => ({
      url: `${siteUrl}${p}`,
      changeFrequency: "daily" as const,
      priority: p ? 0.8 : 1,
    })),
    ...CATEGORIES.map((c) => ({
      url: `${siteUrl}/categorie/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...SHOPS.map((s) => ({
      url: `${siteUrl}/webshops/${s.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
