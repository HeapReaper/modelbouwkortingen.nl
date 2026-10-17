import type { Metadata } from "next";
import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  localePath,
} from "@/i18n/config";

/** Canonical + hreflang-links voor een pagina in alle talen. */
export function alternates(lang: Locale, path: string): Metadata["alternates"] {
  return {
    canonical: localePath(lang, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, localePath(l, path)])),
      "x-default": localePath(DEFAULT_LOCALE, path),
    },
  };
}

/** RSS-feed (src/app/feed.xml) voor <link rel="alternate" type="application/rss+xml">. */
export function feedLink(
  lang: Locale,
  title: string,
  params: Record<string, string> = {},
): NonNullable<Metadata["alternates"]>["types"] {
  const query = new URLSearchParams({
    ...params,
    ...(lang === DEFAULT_LOCALE ? {} : { lang }),
  }).toString();
  return {
    "application/rss+xml": [
      { url: `/feed.xml${query ? `?${query}` : ""}`, title },
    ],
  };
}
