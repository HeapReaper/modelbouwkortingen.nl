import type { Locale } from "@/i18n/config";
import { de } from "@/i18n/dictionaries/de";
import { en } from "@/i18n/dictionaries/en";
import { es } from "@/i18n/dictionaries/es";
import { fr } from "@/i18n/dictionaries/fr";
import { type Dictionary, nl } from "@/i18n/dictionaries/nl";

export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { nl, en, de, fr, es };

export function getDictionary(lang: Locale): Dictionary {
  return DICTIONARIES[lang];
}
