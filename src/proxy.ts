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
import {
  getMaintenance,
  MAINTENANCE_BYPASS_COOKIE,
  maintenanceBypassToken,
  maintenancePage,
} from "@/lib/maintenance";

/**
 * 1. Basic Auth voor het admin panel en /api/stats.
 * 2. Taalroutering. Alle pagina's staan onder app/[lang]; Nederlands houdt de oorspronkelijke
 *    URL's zonder prefix (intern herschreven naar /nl/...), de andere talen staan onder /en, /de,
 *    /fr en /es.
 *    Automatische detectie: een bezoek aan een URL zonder prefix gaat naar een andere taal als de
 *    bezoeker die taal zelf koos (cookie) of, zonder keuze, als de browser die taal liever wil
 *    (Accept-Language). Zonder Accept-Language (zoals bij de meeste zoekmachines) blijft het
 *    Nederlands.
 * 3. Onderhoudsmodus (adminpanel): bezoekers krijgen een 503-pagina. /admin en de API-routes
 *    blijven werken, en de admin ziet de site gewoon dankzij een cookie die bij elk bezoek aan
 *    /admin gezet wordt.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApi = pathname.startsWith("/api/");
  const { path } = splitLocale(pathname);
  const isAdmin = path === "/admin" || path.startsWith("/admin/");
  if (isApi || isAdmin) {
    const denied = checkAdmin(request, isApi);
    if (denied) return denied;
    if (isApi) return NextResponse.next();
  }

  if (isAdmin) return withBypassCookie(route(request));
  return (await maintenanceResponse(request)) ?? route(request);
}

function route(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
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
    const lang = visitorLocale(request);
    if (lang !== DEFAULT_LOCALE) {
      const url = request.nextUrl.clone();
      url.pathname = localePath(lang, pathname);
      const res = NextResponse.redirect(url, 307);
      res.headers.set("Vary", "Accept-Language, Cookie");
      return res;
    }
  }

  // Op basis van request.url, niet request.nextUrl: die heeft in productie "localhost" als origin,
  // waardoor Next de rewrite als externe proxy behandelt (HTTP-verzoek naar zichzelf, dat via de
  // /nl-redirect hierboven in een lus belandt).
  const target = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}${request.nextUrl.search}`;
  const res = NextResponse.rewrite(new URL(target, request.url));
  res.headers.set("Vary", "Accept-Language, Cookie");
  return res;
}

/** Taal uit de URL, anders de gekozen taal (cookie), anders Accept-Language. */
function visitorLocale(request: NextRequest) {
  const first = request.nextUrl.pathname.split("/")[1];
  if (hasLocale(first)) return first;
  const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
  return hasLocale(chosen)
    ? chosen
    : negotiateLocale(request.headers.get("accept-language"));
}

async function maintenanceResponse(
  request: NextRequest,
): Promise<NextResponse | null> {
  const maintenance = await getMaintenance();
  if (!maintenance.enabled) return null;
  const token = maintenanceBypassToken();
  if (
    token &&
    request.cookies.get(MAINTENANCE_BYPASS_COOKIE)?.value === token
  ) {
    return null;
  }
  return new NextResponse(
    maintenancePage(visitorLocale(request), maintenance.message),
    {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "600",
      },
    },
  );
}

/** Ingelogd op /admin: deze browser mag de site ook in onderhoudsmodus zien. */
function withBypassCookie(res: NextResponse): NextResponse {
  const token = maintenanceBypassToken();
  if (token) {
    res.cookies.set(MAINTENANCE_BYPASS_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
  }
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
