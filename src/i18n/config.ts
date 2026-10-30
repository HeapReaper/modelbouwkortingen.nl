/** Talen van de site. Nederlands staat zonder prefix op de oorspronkelijke URL's. */
export const LOCALES = ["nl", "en", "de", "fr", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "nl";

/** Cookie met de taal die de bezoeker zelf koos; wint van de browsertaal. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_NAMES: Record<Locale, string> = {
  nl: "Nederlands",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
};

/** Voor Intl (getallen, bedragen, datums). */
export const INTL_LOCALES: Record<Locale, string> = {
  nl: "nl-NL",
  en: "en-GB",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
};

export const OG_LOCALES: Record<Locale, string> = {
  nl: "nl_NL",
  en: "en_GB",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
};

export function hasLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

/** "/aanbiedingen" → "/en/aanbiedingen" (Nederlands blijft zonder prefix). */
export function localePath(lang: Locale, path: string): string {
  if (lang === DEFAULT_LOCALE) return path;
  if (path === "/" || path === "") return `/${lang}`;
  return `/${lang}${path}`;
}

/** "/en/aanbiedingen" → { lang: "en", path: "/aanbiedingen" }. */
export function splitLocale(pathname: string): { lang: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (hasLocale(first)) {
    return { lang: first, path: `/${rest.join("/")}` };
  }
  return { lang: DEFAULT_LOCALE, path: pathname || "/" };
}

/**
 * Kiest een taal uit de Accept-Language-header. Geen header (zoals bij de meeste bots) =
 * Nederlands; wel een header maar geen van onze talen (bv. Italiaans) = Engels.
 */
export function negotiateLocale(header: string | null): Locale {
  if (!header?.trim()) return DEFAULT_LOCALE;
  const wanted = header
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = Number(
        params.find((p) => p.trim().startsWith("q="))?.split("=")[1] ?? 1,
      );
      return { lang: tag.split("-")[0], q: Number.isFinite(q) ? q : 0, i };
    })
    .filter((w) => w.lang && w.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const w of wanted) {
    if (hasLocale(w.lang)) return w.lang;
  }
  return wanted.length > 0 ? "en" : DEFAULT_LOCALE;
}
