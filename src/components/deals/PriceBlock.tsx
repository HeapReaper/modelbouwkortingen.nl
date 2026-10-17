import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import { cn } from "@/lib/utils";

export async function PriceBlock({
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
  const { dict, fmt } = await getI18n();
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
          {fmt.euro(price)}
        </span>
        {referencePrice && referencePrice > price ? (
          <span
            className={cn(
              "text-muted-foreground tabular-nums line-through",
              lg ? "text-xl" : "text-base",
            )}
          >
            <span className="sr-only">{dict.deals.wasSr}</span>
            {fmt.euro(referencePrice)}
          </span>
        ) : null}
      </div>
      {discountAmount > 0 ? (
        <span
          className={cn("font-bold text-savings", lg ? "text-lg" : "text-sm")}
        >
          {t(dict.deals.youSave, { amount: fmt.euro(discountAmount) })}
        </span>
      ) : null}
    </div>
  );
}
