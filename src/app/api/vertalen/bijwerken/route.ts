import { connection } from "next/server";
import { isCronAuthorized } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { translatePendingDeals } from "@/lib/translate";

/**
 * Vertaalt de namen van nieuwe deals van Duitse en Franse webshops (zie src/lib/translate.ts).
 * Wordt elke paar minuten aangeroepen door de planner in instrumentation.ts ("Authorization:
 * Bearer <NEWSLETTER_CRON_TOKEN>"), of handmatig met de admin-login.
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
    return Response.json(await translatePendingDeals());
  } catch (err) {
    console.error("[vertalen] bijwerken mislukt", err);
    return Response.json({ status: "error" }, { status: 500 });
  }
}
