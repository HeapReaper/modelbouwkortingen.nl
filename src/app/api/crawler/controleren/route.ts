import { connection } from "next/server";
import { isCronAuthorized } from "@/lib/admin-auth";
import { checkCrawlRuns } from "@/lib/crawl-alerts";
import { isDbConfigured } from "@/lib/db";

/**
 * Zoekt crawl-rondes die opvallend weinig producten zagen (parser kapot?) en meldt ze via
 * ALERT_DISCORD_WEBHOOK. Wordt elke paar minuten aangeroepen door de planner in
 * instrumentation.ts, of handmatig met de admin-login.
 */
export async function POST(request: Request) {
  await connection();
  if (!isCronAuthorized(request.headers.get("authorization"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return Response.json({ status: "not-configured" });
  }
  try {
    return Response.json(await checkCrawlRuns());
  } catch (err) {
    console.error("[crawler] controleren mislukt", err);
    return Response.json({ status: "error" }, { status: 500 });
  }
}
