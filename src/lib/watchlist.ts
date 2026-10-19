"use client";

import { useSyncExternalStore } from "react";
import { setWatchlistItem } from "@/app/[lang]/account/actions";
import { getAccount } from "@/lib/account-client";

/**
 * Volglijst: product-id's in localStorage van deze browser. Kan leeg terugkomen (privévenster,
 * geblokkeerde opslag); dan werkt alles gewoon met een lege lijst. Met een account is de lijst
 * in de database leidend en is dit een kopie ervan (zie AccountBridge); elke wijziging gaat dan
 * ook naar de server.
 */

const KEY = "mbk-volglijst";
/** Id van het account waarmee de lijst in deze browser gelijkgetrokken is. */
const ACCOUNT_KEY = "mbk-volglijst-account";
const MAX = 100;
const EVENT = "mbk-volglijst";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): number[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((v): v is number => Number.isSafeInteger(v) && v > 0)
      : [];
  } catch {
    return [];
  }
}

function write(ids: number[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
  } catch {
    // Opslag geblokkeerd: dan onthouden we het niet.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  // "storage" = gewijzigd in een ander tabblad.
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** De volglijst zoals die nu in de opslag staat (alleen in de browser aanroepen). */
export function readWatchlist(): number[] {
  return parse(read());
}

/** Vervangt de lijst in deze browser (met de lijst van het account). */
export function replaceWatchlist(ids: number[]) {
  if (ids.join(",") !== readWatchlist().join(",")) write(ids);
}

/** Met welk account de lijst in deze browser gelijkgetrokken is (null = geen). */
export function syncedAccount(): number | null {
  try {
    const v = Number(localStorage.getItem(ACCOUNT_KEY));
    return Number.isSafeInteger(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function setSyncedAccount(id: number | null) {
  try {
    if (id === null) localStorage.removeItem(ACCOUNT_KEY);
    else localStorage.setItem(ACCOUNT_KEY, String(id));
  } catch {
    // Opslag geblokkeerd: dan wordt er bij elke paginalading opnieuw samengevoegd.
  }
}

/** De volglijst, nieuwste eerst. Op de server (en vóór hydratie) leeg. */
export function useWatchlist() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const ids = parse(raw);
  return {
    ids,
    has: (id: number) => ids.includes(id),
    toggle: (id: number) => {
      const current = parse(read());
      const watched = !current.includes(id);
      write(watched ? [id, ...current] : current.filter((x) => x !== id));
      if (getAccount())
        setWatchlistItem(id, watched).catch((err) =>
          console.error("[volglijst] opslaan in account mislukt", err),
        );
    },
  };
}
