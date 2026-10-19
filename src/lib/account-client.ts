"use client";

import { useSyncExternalStore } from "react";

/**
 * Wie er in deze browser is ingelogd (alleen voor de UI; elke Server Action controleert de
 * sessie zelf). Gezet door <AccountBridge> in het layout; null = niet ingelogd of nog onbekend.
 */
export type ClientAccount = { id: number; email: string };

let account: ClientAccount | null = null;
const listeners = new Set<() => void>();

export function setAccount(next: ClientAccount | null) {
  if (account?.id === next?.id && account?.email === next?.email) return;
  account = next;
  for (const l of listeners) l();
}

export function getAccount() {
  return account;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function useAccount(): ClientAccount | null {
  return useSyncExternalStore(subscribe, getAccount, () => null);
}
