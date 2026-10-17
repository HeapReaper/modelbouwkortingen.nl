import { connection } from "next/server";
import { isCronAuthorized } from "@/lib/admin-auth";
import { isDbConfigured } from "@/lib/db";
import { sendDailyDigest } from "@/lib/newsletter";

/**
 * Verstuurt de dagelijkse kortingsmail (hooguit één keer per dag). Wordt aangeroepen door de
 * planner in instrumentation.ts met "Authorization: Bearer <NEWSLETTER_CRON_TOKEN>", of
 * handmatig met de admin-login. `?nu=1` negeert het verzenduur (NEWSLETTER_SEND_HOUR).
 */
export async function POST(request: Request) {
  await connection();
  if (!isCronAuthorized(request.headers.get("authorization"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return Response.json({ status: "not-configured" });
  }
  const ignoreHour = new URL(request.url).searchParams.get("nu") === "1";
  try {
    return Response.json(await sendDailyDigest({ ignoreHour }));
  } catch (err) {
    console.error("[nieuwsbrief] verzenden mislukt", err);
    return Response.json({ status: "error" }, { status: 500 });
  }
}
