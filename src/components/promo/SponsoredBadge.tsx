import { Megaphone } from "lucide-react";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";

/**
 * Label voor betaalde plaatsingen (uitgelichte webshops en producten). Reclame moet als
 * reclame herkenbaar zijn; de uitleg staat in de title en voor schermlezers.
 */
export async function SponsoredBadge({ className }: { className?: string }) {
  const { dict } = await getI18n();
  return (
    <span
      title={dict.promo.sponsoredInfo}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground",
        className,
      )}
    >
      <Megaphone className="size-3" aria-hidden />
      {dict.promo.sponsored}
      <span className="sr-only">: {dict.promo.sponsoredInfo}</span>
    </span>
  );
}
