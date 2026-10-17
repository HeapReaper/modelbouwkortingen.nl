"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { t } from "@/i18n/translate";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/lib/watchlist";

/** Hartje: product op de volglijst zetten of eraf halen. */
export function WatchButton({
  id,
  name,
  full,
  className,
}: {
  id: number;
  name: string;
  /** Met tekst (productpagina) in plaats van alleen een icoon (dealkaart). */
  full?: boolean;
  className?: string;
}) {
  const { dict } = useI18n();
  const w = dict.watchlist;
  const { has, toggle } = useWatchlist();
  const active = has(id);
  const label = t(active ? w.removeLabel : w.addLabel, { name });
  return (
    <Button
      type="button"
      variant={full ? "outline" : "secondary"}
      size={full ? "lg" : "icon"}
      aria-pressed={active}
      aria-label={full ? undefined : label}
      title={label}
      onClick={() => toggle(id)}
      className={cn(
        full
          ? "h-12 text-base font-bold"
          : "size-9 rounded-full bg-background/90 shadow-sm backdrop-blur hover:bg-background",
        className,
      )}
    >
      <Heart
        className={cn(
          full ? "size-5" : "size-4",
          active && "fill-primary text-primary",
        )}
      />
      {full ? (active ? w.saved : w.save) : null}
    </Button>
  );
}

/** Link naar de volglijst met het aantal producten, voor in de navbar. */
export function WatchlistCount() {
  const { ids } = useWatchlist();
  if (ids.length === 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground tabular-nums">
      {ids.length > 99 ? "99+" : ids.length}
    </span>
  );
}
