import { connection } from "next/server";
import { isCronAuthorized } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { sendDueAlerts } from "@/lib/price-alerts";

/**
 * Verstuurt de prijsalarmen waarvan de doelprijs bereikt is. Wordt elke paar minuten
 * aangeroepen door de planner in instrumentation.ts ("Authorization: Bearer
 * <NEWSLETTER_CRON_TOKEN>"), of handmatig met de admin-login.
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
    return Response.json(await sendDueAlerts());
  } catch (err) {
    console.error("[prijsalarm] controleren mislukt", err);
    return Response.json({ status: "error" }, { status: 500 });
  }
}
