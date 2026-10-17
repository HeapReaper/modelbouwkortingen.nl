"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useI18n } from "@/i18n/client";
import { readWatchlist, useWatchlist } from "@/lib/watchlist";

/**
 * De volglijst staat in de browser; de server rendert de producten uit ?ids=. Houdt die
 * query-string gelijk aan de lijst in localStorage (ook na verwijderen met het hartje).
 */
export function WatchlistSync({ current }: { current: string }) {
  const router = useRouter();
  const { href } = useI18n();
  // Alleen om opnieuw te synchroniseren als de lijst verandert; de waarde zelf lezen we
  // direct uit de opslag, want tijdens hydratie geeft de hook nog een lege lijst.
  const { ids } = useWatchlist();
  const changed = ids.join(",");
  useEffect(() => {
    void changed;
    const wanted = readWatchlist().join(",");
    if (wanted === current) return;
    router.replace(
      wanted ? `${href("/volglijst")}?ids=${wanted}` : href("/volglijst"),
      { scroll: false },
    );
  }, [changed, current, router, href]);
  return null;
}
