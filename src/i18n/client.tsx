"use client";

import { createContext, useContext, useMemo } from "react";
import { type Locale, localePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { formatters } from "@/lib/format";

type ClientI18n = {
  lang: Locale;
  dict: Dictionary;
  href: (path: string) => string;
  fmt: ReturnType<typeof formatters>;
};

const I18nContext = createContext<ClientI18n | null>(null);

/** Geeft taal en woordenboek door aan Client Components (vanuit het [lang]-layout). */
export function I18nProvider({
  lang,
  dict,
  children,
}: {
  lang: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      lang,
      dict,
      href: (path: string) => localePath(lang, path),
      fmt: formatters(lang),
    }),
    [lang, dict],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useI18n(): ClientI18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n() buiten <I18nProvider>");
  return ctx;
}
