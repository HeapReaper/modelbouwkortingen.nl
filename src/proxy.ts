import { type NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  hasLocale,
  LOCALE_COOKIE,
  localePath,
  negotiateLocale,
  splitLocale,
} from "@/i18n/config";
import { adminEnabled, isAuthorized } from "@/lib/admin-auth";

/**
 * 1. Basic Auth voor het admin panel en /api/stats.
 * 2. Taalroutering. Alle pagina's staan onder app/[lang]; Nederlands houdt de oorspronkelijke
 *    URL's zonder prefix (intern herschreven naar /nl/...), Engels en Duits staan onder /en en /de.
 *    Automatische detectie: een bezoek aan een URL zonder prefix gaat naar /en of /de als de
 *    bezoeker die taal zelf koos (cookie) of, zonder keuze, als de browser die taal liever wil
 *    (Accept-Language). Zonder Accept-Language (zoals bij de meeste zoekmachines) blijft het
 *    Nederlands.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApi = pathname.startsWith("/api/");
  const { path } = splitLocale(pathname);
  if (isApi || path === "/admin" || path.startsWith("/admin/")) {
    const denied = checkAdmin(request, isApi);
    if (denied) return denied;
    if (isApi) return NextResponse.next();
  }

  const first = pathname.split("/")[1];
  // /nl/... bestaat alleen intern: de Nederlandse URL is die zonder prefix.
  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (hasLocale(first)) return NextResponse.next();

  // Alleen bij gewoon bekijken omleiden, niet bij formulieren (Server Actions zijn POSTs).
  if (request.method === "GET" || request.method === "HEAD") {
    const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
    const lang = hasLocale(chosen)
      ? chosen
      : negotiateLocale(request.headers.get("accept-language"));
    if (lang !== DEFAULT_LOCALE) {
      const url = request.nextUrl.clone();
      url.pathname = localePath(lang, pathname);
      const res = NextResponse.redirect(url, 307);
      res.headers.set("Vary", "Accept-Language, Cookie");
      return res;
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  const res = NextResponse.rewrite(url);
  res.headers.set("Vary", "Accept-Language, Cookie");
  return res;
}

function checkAdmin(request: NextRequest, isApi: boolean): NextResponse | null {
  if (!adminEnabled() && !(isApi && process.env.STATS_TOKEN)) {
    return new NextResponse(
      "Admin is uitgeschakeld. Zet ADMIN_PASSWORD om het in te schakelen.",
      { status: 503 },
    );
  }
  if (
    isAuthorized(request.headers.get("authorization"), { allowToken: isApi })
  ) {
    return null;
  }
  return new NextResponse("Inloggen vereist", {
    status: 401,
    headers: {
      "WWW-Authenticate":
        'Basic realm="Modelbouwkortingen admin", charset="UTF-8"',
    },
  });
}

export const config = {
  // Alle pagina's (voor de taalroutering) plus /api/stats (Basic Auth). Geen andere API-routes,
  // Next-bestanden en statische bestanden (alles met een extensie, zoals icon.svg, robots.txt,
  // sitemap.xml en discord-avatar.png).
  matcher: ["/api/stats", "/((?!api/|_next/|.*\\.[\\w]+$).*)"],
};
