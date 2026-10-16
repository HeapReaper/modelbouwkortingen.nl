import { formatEuro } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PriceBlock({
  price,
  referencePrice,
  discountAmount,
  size = "default",
  className,
}: {
  price: number;
  referencePrice: number | null;
  discountAmount: number;
  size?: "default" | "lg";
  className?: string;
}) {
  const lg = size === "lg";
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span
          className={cn(
            "font-heading font-black tracking-tight tabular-nums",
            lg ? "text-4xl" : "text-2xl",
          )}
        >
          {formatEuro(price)}
        </span>
        {referencePrice && referencePrice > price ? (
          <span
            className={cn(
              "text-muted-foreground tabular-nums line-through",
              lg ? "text-xl" : "text-base",
            )}
          >
            <span className="sr-only">Was </span>
            {formatEuro(referencePrice)}
          </span>
        ) : null}
      </div>
      {discountAmount > 0 ? (
        <span
          className={cn("font-bold text-savings", lg ? "text-lg" : "text-sm")}
        >
          Je bespaart {formatEuro(discountAmount)}
        </span>
      ) : null}
    </div>
  );
}
