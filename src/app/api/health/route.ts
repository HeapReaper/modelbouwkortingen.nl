import { connection } from "next/server";
import { getPrisma, isDbConfigured } from "@/lib/db";

/** Publieke health check voor Docker/loadbalancers. */
export async function GET() {
  await connection();
  if (!isDbConfigured()) {
    return Response.json({ status: "ok", db: "not-configured" });
  }
  try {
    await getPrisma().category.count();
    return Response.json({ status: "ok", db: "ok" });
  } catch {
    return Response.json({ status: "degraded", db: "error" }, { status: 503 });
  }
}
