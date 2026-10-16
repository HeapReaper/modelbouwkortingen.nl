"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { isAuthorized } from "@/lib/admin-auth";
import { isDbConfigured, query } from "@/lib/db";

async function assertAdmin() {
  if (!isAuthorized((await headers()).get("authorization")))
    throw new Error("Niet ingelogd");
  if (!isDbConfigured()) throw new Error("Geen database");
}

export async function toggleMessageHandled(id: number, handled: boolean) {
  await assertAdmin();
  await query("UPDATE contact_messages SET handled = $2 WHERE id = $1", [
    id,
    handled,
  ]);
  refresh();
}

export async function toggleShopEnabled(slug: string, enabled: boolean) {
  await assertAdmin();
  await query("UPDATE shops SET enabled = $2 WHERE slug = $1", [slug, enabled]);
  refresh();
}
