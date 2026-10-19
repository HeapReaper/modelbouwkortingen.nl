"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Gezet door het admin panel: dit apparaat telt niet mee in de statistieken. */
export const OPT_OUT_KEY = "mbk-geen-statistieken";

let firstView = true;
let last = { path: "", at: 0 };

/**
 * Meldt elke paginaweergave aan /api/bezoek: bij het laden en bij elke navigatie binnen de site.
 * Geen cookies; zie src/lib/analytics.ts. usePathname() dient alleen als signaal dat de pagina
 * veranderde, het pad zelf komt uit de adresbalk (de Nederlandse URL's worden intern herschreven).
 */
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || skip()) return;
    const send = () => {
      const path = window.location.pathname;
      const now = Date.now();
      // Dubbele effecten (React Strict Mode) en dubbele navigaties niet dubbel tellen.
      if (last.path === path && now - last.at < 2000) return;
      last = { path, at: now };
      const body: { p: string; r?: string; e?: boolean } = { p: path };
      if (firstView) {
        firstView = false;
        const source = externalSource();
        if (source !== undefined) {
          body.e = true;
          if (source) body.r = source;
        }
      }
      navigator.sendBeacon("/api/bezoek", JSON.stringify(body));
    };
    // Door de browser vooraf geladen (speculation rules): pas tellen als hij echt getoond wordt.
    if ((document as { prerendering?: boolean }).prerendering) {
      document.addEventListener("prerenderingchange", send, { once: true });
      return () => document.removeEventListener("prerenderingchange", send);
    }
    send();
  }, [pathname]);
  return null;
}

function skip() {
  if (navigator.webdriver || !navigator.sendBeacon) return true;
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Waar het bezoek vandaan komt: utm_source/ref uit de URL, anders de host van de verwijzende site,
 * "" voor direct, undefined als de bezoeker van onze eigen site kwam (herladen, nieuw tabblad).
 */
function externalSource(): string | undefined {
  const params = new URLSearchParams(window.location.search);
  const tagged = params.get("utm_source") ?? params.get("ref");
  if (tagged) return tagged;
  if (!document.referrer) return "";
  try {
    const host = new URL(document.referrer).hostname;
    return host === window.location.hostname ? undefined : host;
  } catch {
    return "";
  }
}
