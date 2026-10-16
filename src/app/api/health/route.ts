import { connection } from "next/server";
import { isDbConfigured, query } from "@/lib/db";

/** Publieke health check voor Docker/loadbalancers. */
export async function GET() {
  await connection();
  if (!isDbConfigured()) {
    return Response.json({ status: "ok", db: "not-configured" });
  }
  try {
    await query("SELECT 1");
    return Response.json({ status: "ok", db: "ok" });
  } catch {
    return Response.json({ status: "degraded", db: "error" }, { status: 503 });
  }
}
