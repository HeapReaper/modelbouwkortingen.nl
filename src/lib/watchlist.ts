"use client";

import { useSyncExternalStore } from "react";

/**
 * Volglijst zonder account: product-id's in localStorage van deze browser. Kan leeg terugkomen
 * (privévenster, geblokkeerde opslag); dan werkt alles gewoon met een lege lijst.
 */

const KEY = "mbk-volglijst";
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

/** De volglijst, nieuwste eerst. Op de server (en vóór hydratie) leeg. */
export function useWatchlist() {
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const ids = parse(raw);
  return {
    ids,
    has: (id: number) => ids.includes(id),
    toggle: (id: number) => {
      const current = parse(read());
      write(
        current.includes(id)
          ? current.filter((x) => x !== id)
          : [id, ...current],
      );
    },
  };
}
