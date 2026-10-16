import { cn } from "@/lib/utils";

/** Rood prijskaartje met het kortingspercentage. */
export function DiscountBadge({
  percent,
  size = "default",
  className,
}: {
  percent: number;
  size?: "default" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "price-tag inline-flex items-center bg-primary font-heading font-black text-primary-foreground tabular-nums shadow-sm",
        size === "lg"
          ? "py-1.5 pr-3 pl-5 text-2xl"
          : "py-1 pr-2.5 pl-4 text-base",
        className,
      )}
    >
      -{Math.round(percent)}%
    </span>
  );
}
