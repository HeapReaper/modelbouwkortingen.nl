"use client";

import { useEffect } from "react";
import { mergeWatchlist } from "@/app/[lang]/account/actions";
import { type ClientAccount, setAccount } from "@/lib/account-client";
import {
  readWatchlist,
  replaceWatchlist,
  setSyncedAccount,
  syncedAccount,
} from "@/lib/watchlist";

/**
 * Brengt de inlogstatus van de server naar de browser en houdt de volglijst gelijk:
 *   - eerste keer ingelogd in deze browser: de lokale lijst gaat naar het account;
 *   - daarna: de lijst van het account is leidend (ook na wijzigingen op een ander apparaat);
 *   - uitgelogd: de kopie van het account wordt uit deze browser gewist.
 */
export function AccountBridge({
  account,
  watchlist,
}: {
  account: ClientAccount | null;
  watchlist: number[];
}) {
  const id = account?.id ?? null;
  const email = account?.email ?? null;
  const ids = watchlist.join(",");
  useEffect(() => {
    if (id === null || email === null) {
      setAccount(null);
      if (syncedAccount() !== null) {
        replaceWatchlist([]);
        setSyncedAccount(null);
      }
      return;
    }
    setAccount({ id, email });
    const server = ids ? ids.split(",").map(Number) : [];
    if (syncedAccount() === id) {
      replaceWatchlist(server);
      return;
    }
    const local = readWatchlist();
    const missing = local.filter((p) => !server.includes(p));
    setSyncedAccount(id);
    if (missing.length === 0) {
      replaceWatchlist(server);
      return;
    }
    replaceWatchlist([...missing, ...server]);
    mergeWatchlist(missing)
      .then(replaceWatchlist)
      .catch((err) => console.error("[volglijst] samenvoegen mislukt", err));
  }, [id, email, ids]);
  return null;
}
