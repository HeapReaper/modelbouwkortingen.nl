import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { DiscountBadge } from "@/components/deals/DiscountBadge";
import { PriceBlock } from "@/components/deals/PriceBlock";
import { ProductImage } from "@/components/deals/ProductImage";
import { ShopBadge } from "@/components/deals/ShopBadge";
import { buttonVariants } from "@/components/ui/button";
import type { Deal } from "@/lib/deals";
import { cn } from "@/lib/utils";

export function DealCard({
  deal,
  className,
  eager,
}: {
  deal: Deal;
  className?: string;
  eager?: boolean;
}) {
  return (
    <article
      className={cn(
        "group/deal relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative">
        <ProductImage
          src={deal.imageUrl}
          alt={deal.name}
          categorySlug={deal.categorySlug}
          eager={eager}
          className="aspect-[4/3] w-full"
        />
        <DiscountBadge
          percent={deal.discountPercent}
          className="absolute top-3 right-0"
        />
        {deal.inStock === false ? (
          <span className="absolute bottom-2 left-2 rounded-md bg-foreground/85 px-2 py-0.5 text-xs font-semibold text-background">
            Niet op voorraad
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <ShopBadge
          slug={deal.shopSlug}
          name={deal.shopName}
          className="text-muted-foreground"
        />
        <h3 className="line-clamp-2 font-sans text-base leading-snug font-semibold">
          <Link
            href={`/product/${deal.id}`}
            className="after:absolute after:inset-0 hover:underline"
          >
            {deal.name}
          </Link>
        </h3>
        <PriceBlock
          price={deal.price}
          referencePrice={deal.referencePrice}
          discountAmount={deal.discountAmount}
          className="mt-auto"
        />
        <a
          href={deal.url}
          target="_blank"
          rel="noopener nofollow"
          aria-label={`Bekijk ${deal.name} bij ${deal.shopName}`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "relative z-10 h-11 w-full min-w-0 text-base font-bold",
          )}
        >
          Naar de webshop
          <ExternalLink className="size-4" />
        </a>
      </div>
    </article>
  );
}
