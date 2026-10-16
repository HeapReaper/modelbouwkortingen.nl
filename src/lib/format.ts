import { formatDistanceToNowStrict } from "date-fns";
import { nl } from "date-fns/locale";

const euro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
});
const euroRound = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const int = new Intl.NumberFormat("nl-NL");

export function formatEuro(value: number, opts?: { round?: boolean }) {
  return (opts?.round ? euroRound : euro).format(value);
}

export function formatNumber(value: number) {
  return int.format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return null;
  return formatDistanceToNowStrict(new Date(iso), {
    locale: nl,
    addSuffix: true,
  });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
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
