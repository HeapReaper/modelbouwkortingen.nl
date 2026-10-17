import { connection } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { unsubscribe } from "@/lib/newsletter";

/**
 * Afmelden met één klik vanuit de mailclient (RFC 8058, "List-Unsubscribe-Post"): Gmail en
 * Yahoo sturen een POST naar de URL uit de List-Unsubscribe-header.
 */
export async function POST(request: Request) {
  await connection();
  const token = new URL(request.url).searchParams.get("token");
  if (!token || !isDbConfigured()) {
    return new Response("Onbekende link", { status: 400 });
  }
  const ok = await unsubscribe(token);
  return new Response(ok ? "Je bent afgemeld." : "Onbekende link", {
    status: ok ? 200 : 404,
  });
}
