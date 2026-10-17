import type { MetadataRoute } from "next";
import { LOCALES, localePath } from "@/i18n/config";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://modelbouwkortingen.nl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        ...LOCALES.flatMap((l) => [
          localePath(l, "/admin"),
          localePath(l, "/zoeken"),
        ]),
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
