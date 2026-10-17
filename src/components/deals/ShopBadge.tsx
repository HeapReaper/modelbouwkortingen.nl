import { ShopLogo } from "@/components/core/ShopLogo";
import { getShop } from "@/lib/shops";
import { cn } from "@/lib/utils";

export function ShopBadge({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const shop = getShop(slug);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-semibold",
        className,
      )}
    >
      {shop ? (
        <span aria-hidden="true">
          <ShopLogo shop={shop} className="h-5 w-14 rounded px-1 py-0.5" />
        </span>
      ) : null}
      {name}
      {shop?.country ? (
        <span
          title={shop.country}
          className="rounded bg-muted px-1 py-px text-[10px] leading-tight font-bold text-muted-foreground"
        >
          {shop.country}
        </span>
      ) : null}
    </span>
  );
}
