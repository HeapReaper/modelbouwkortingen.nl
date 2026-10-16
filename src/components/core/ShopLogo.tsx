import Image from "next/image";
import type { ShopInfo } from "@/lib/shops";
import { cn } from "@/lib/utils";

/** Logo van een webshop op een eigen achtergrond; geef hoogte en breedte mee via className. */
export function ShopLogo({
  shop,
  className,
}: {
  shop: ShopInfo;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg px-2 py-1.5",
        shop.logoBg,
        className,
      )}
    >
      <Image
        src={shop.logo}
        alt={shop.name}
        sizes="128px"
        className="h-auto max-h-full w-auto max-w-full object-contain"
      />
    </span>
  );
}
