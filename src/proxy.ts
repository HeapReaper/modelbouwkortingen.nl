import { type NextRequest, NextResponse } from "next/server";
import { adminEnabled, isAuthorized } from "@/lib/admin-auth";

export function proxy(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  if (!adminEnabled() && !(isApi && process.env.STATS_TOKEN)) {
    return new NextResponse(
      "Admin is uitgeschakeld. Zet ADMIN_PASSWORD om het in te schakelen.",
      {
        status: 503,
      },
    );
  }
  if (
    isAuthorized(request.headers.get("authorization"), { allowToken: isApi })
  ) {
    return NextResponse.next();
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
  matcher: ["/admin/:path*", "/api/stats"],
};
