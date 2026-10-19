import { AccountBridge } from "@/components/account/AccountBridge";
import { getWatchlist } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth";

/** Leest de sessie (dus binnen <Suspense> in het layout) en geeft die door aan de browser. */
export async function AccountState() {
  const user = await getCurrentUser();
  return (
    <AccountBridge
      account={user}
      watchlist={user ? await getWatchlist(user.id) : []}
    />
  );
}
