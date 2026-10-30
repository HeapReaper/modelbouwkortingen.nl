import { connection } from "next/server";
import { getAdminOverview, getCrawlerLive } from "@/lib/admin";
import { isAuthorized } from "@/lib/admin-auth";
import { cached } from "@/lib/cache";

/**
 * JSON met alle stats (database + live crawler). Beveiligd via Basic Auth (ADMIN_PASSWORD)
 * of "Authorization: Bearer <STATS_TOKEN>" — handig voor monitoring (Uptime Kuma, Grafana, ...).
 */
export async function GET(request: Request) {
  await connection();
  if (
    !isAuthorized(request.headers.get("authorization"), { allowToken: true })
  ) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const [overview, crawler] = await Promise.all([
    // Monitoring vraagt dit vaak op; de tellingen gaan over hele tabellen.
    cached("api-stats-overview", 60_000, getAdminOverview),
    getCrawlerLive(),
  ]);
  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      deals: overview.shops.reduce((s, x) => s + x.deals, 0),
      products: overview.shops.reduce((s, x) => s + x.products, 0),
      ...overview,
      crawler,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
