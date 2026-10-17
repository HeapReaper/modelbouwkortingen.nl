import { TrendingDown } from "lucide-react";
import { getI18n } from "@/i18n/server";
import type { Deal } from "@/lib/deals";
import { cn } from "@/lib/utils";

/** "Laagste prijs ooit" / "Laagste prijs in 30 dagen" (zie withPriceInsights()). */
export async function LowestBadge({
  lowest,
  className,
}: {
  lowest: Deal["lowest"];
  className?: string;
}) {
  if (!lowest) return null;
  const { dict } = await getI18n();
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-md bg-savings/15 px-2 py-0.5 text-xs font-bold text-savings",
        className,
      )}
    >
      <TrendingDown className="size-3.5" />
      {lowest === "ever" ? dict.deals.lowestEver : dict.deals.lowest30}
    </span>
  );
}
