import type { Locale } from "@/i18n/config";
import { de } from "@/i18n/dictionaries/de";
import { en } from "@/i18n/dictionaries/en";
import { type Dictionary, nl } from "@/i18n/dictionaries/nl";

export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { nl, en, de };

export function getDictionary(lang: Locale): Dictionary {
  return DICTIONARIES[lang];
}
