import { formatDistanceToNowStrict } from "date-fns";
import { de, enGB, nl } from "date-fns/locale";
import { DEFAULT_LOCALE, INTL_LOCALES, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/nl";
import { t } from "@/i18n/translate";
import type { ShopVat } from "@/lib/shops";

const DATE_FNS = { nl, en: enGB, de };

/** Getallen, bedragen en datums in de notatie van een taal. */
export function formatters(lang: Locale) {
  const locale = INTL_LOCALES[lang];
  const euro = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  });
  const euroRound = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const int = new Intl.NumberFormat(locale);
  const dateTime = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  });
  const shortDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });
  const longDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeZone: "Europe/Amsterdam",
  });
  const regions = new Intl.DisplayNames(locale, { type: "region" });
  const languages = new Intl.DisplayNames(locale, { type: "language" });
  return {
    euro: (value: number, opts?: { round?: boolean }) =>
      (opts?.round ? euroRound : euro).format(value),
    number: (value: number) => int.format(value),
    timeAgo: (iso: string | null | undefined) =>
      iso
        ? formatDistanceToNowStrict(new Date(iso), {
            locale: DATE_FNS[lang],
            addSuffix: true,
          })
        : null,
    dateTime: (iso: string | null | undefined) =>
      iso ? dateTime.format(new Date(iso)) : "—",
    shortDate: (date: Date | number) => shortDate.format(date),
    /** "30 oktober 2026". */
    longDate: (date: Date | number) => longDate.format(date),
    /** "DE" → "Duitsland" / "Germany" / "Deutschland". */
    country: (code: string) => {
      try {
        return regions.of(code) ?? code;
      } catch {
        return code;
      }
    },
    /** "de" → "Duits" / "German" / "Deutsch". */
    language: (code: string) => {
      try {
        return languages.of(code) ?? code;
      } catch {
        return code;
      }
    },
  };
}

// Nederlandse varianten, voor plekken zonder taal (admin, logs).
const nlFormat = formatters(DEFAULT_LOCALE);

export function formatEuro(value: number, opts?: { round?: boolean }) {
  return nlFormat.euro(value, opts);
}

export function formatNumber(value: number) {
  return nlFormat.number(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function timeAgo(iso: string | null | undefined) {
  return nlFormat.timeAgo(iso);
}

export function formatDateTime(iso: string | null | undefined) {
  return nlFormat.dateTime(iso);
}

/** De btw-regel bij een prijs, of null als we niet weten welke btw er in de prijzen zit. */
export function vatNote(
  vat: ShopVat | null,
  v: Dictionary["vat"],
  fmt: ReturnType<typeof formatters>,
) {
  if (!vat) return null;
  if (vat.kind !== "home") return v[vat.kind];
  return t(v.home, {
    rate: fmt.number(vat.rate),
    country: fmt.country(vat.country),
  });
}

/** Bouwt een URL met query-parameters; lege waarden worden weggelaten. */
export function withParams(
  path: string,
  params: Record<string, string | number | undefined | null>,
) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}
