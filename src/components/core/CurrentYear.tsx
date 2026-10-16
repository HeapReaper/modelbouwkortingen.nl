"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Jaartal client-side, zodat de pagina statisch kan blijven. */
export function CurrentYear() {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => null,
  );
  return <>{year ?? ""}</>;
}
