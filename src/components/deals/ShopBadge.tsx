import { getShop, shopInitials } from "@/lib/shops";
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
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded text-[0.6rem] font-black",
          shop?.color ?? "bg-muted text-foreground",
        )}
        aria-hidden="true"
      >
        {shopInitials(name)}
      </span>
      {name}
    </span>
  );
}
