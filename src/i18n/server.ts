import { lang as rootLang } from "next/root-params";
import {
  DEFAULT_LOCALE,
  hasLocale,
  type Locale,
  localePath,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatters } from "@/lib/format";

/** Taal van de huidige pagina (uit het [lang]-segment). Alleen in Server Components. */
export async function getLang(): Promise<Locale> {
  const value = await rootLang();
  return hasLocale(value) ? value : DEFAULT_LOCALE;
}

export function makeI18n(lang: Locale) {
  return {
    lang,
    dict: getDictionary(lang),
    href: (path: string) => localePath(lang, path),
    fmt: formatters(lang),
  };
}

export type I18n = ReturnType<typeof makeI18n>;

export async function getI18n(): Promise<I18n> {
  return makeI18n(await getLang());
}
