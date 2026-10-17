import { connection } from "next/server";
import { isCronAuthorized } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { postNewDeals } from "@/lib/discord";

/**
 * Post nieuwe deals naar de Discord-webhooks. Wordt elke paar minuten aangeroepen door de
 * planner in instrumentation.ts ("Authorization: Bearer <NEWSLETTER_CRON_TOKEN>"), of
 * handmatig met de admin-login.
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
    return Response.json(await postNewDeals());
  } catch (err) {
    console.error("[discord] posten mislukt", err);
    return Response.json({ status: "error" }, { status: 500 });
  }
}
