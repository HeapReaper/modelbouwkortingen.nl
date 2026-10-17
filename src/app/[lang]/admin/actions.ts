"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { isAuthorized } from "@/lib/admin-auth";
import { getPrisma, isDbConfigured } from "@/lib/db";

async function assertAdmin() {
  if (!isAuthorized((await headers()).get("authorization")))
    throw new Error("Niet ingelogd");
  if (!isDbConfigured()) throw new Error("Geen database");
}

export async function toggleMessageHandled(id: number, handled: boolean) {
  await assertAdmin();
  await getPrisma().contactMessage.updateMany({
    where: { id: BigInt(id) },
    data: { handled },
  });
  refresh();
}

export async function toggleShopEnabled(slug: string, enabled: boolean) {
  await assertAdmin();
  await getPrisma().shop.updateMany({ where: { slug }, data: { enabled } });
  refresh();
}
