import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import Link from "next/link";
import { DiscountBadge } from "@/components/deals/DiscountBadge";
import { LowestBadge } from "@/components/deals/LowestBadge";
import { PriceBlock } from "@/components/deals/PriceBlock";
import { ProductImage } from "@/components/deals/ProductImage";
import { ShopBadge } from "@/components/deals/ShopBadge";
import { SponsoredBadge } from "@/components/promo/SponsoredBadge";
import { buttonVariants } from "@/components/ui/button";
import { WatchButton } from "@/components/watchlist/WatchButton";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import type { Deal } from "@/lib/deals";
import { outLink } from "@/lib/shops";
import { cn } from "@/lib/utils";

export async function DealCard({
  deal,
  className,
  eager,
  sponsored,
}: {
  deal: Deal;
  className?: string;
  eager?: boolean;
  /** Uitgelicht product (betaalde plaatsing): label "Gesponsord", kliks tellen als "featured". */
  sponsored?: boolean;
}) {
  const { dict, href } = await getI18n();
  const link = outLink(deal, sponsored ? "featured" : "site");
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
        {deal.isDeal ? (
          <DiscountBadge
            percent={deal.discountPercent}
            className="absolute top-3 right-0"
          />
        ) : null}
        <WatchButton
          id={deal.id}
          name={deal.name}
          className="absolute top-2 left-2 z-10"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ShopBadge
            slug={deal.shopSlug}
            name={deal.shopName}
            className="text-muted-foreground"
          />
          {sponsored ? <SponsoredBadge /> : null}
        </div>
        {deal.inStock === false ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <XCircle className="size-4" /> {dict.deals.outOfStock}
          </span>
        ) : deal.inStock ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-savings">
            <CheckCircle2 className="size-4" /> {dict.deals.inStock}
          </span>
        ) : null}
        <h3 className="line-clamp-2 font-sans text-base leading-snug font-semibold">
          <Link
            href={href(`/product/${deal.id}`)}
            className="after:absolute after:inset-0 hover:underline"
          >
            {deal.name}
          </Link>
        </h3>
        <div className="mt-auto flex flex-col gap-2">
          {deal.isDeal ? (
            <LowestBadge lowest={deal.lowest} />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              {dict.deals.noLongerDeal}
            </span>
          )}
          <PriceBlock
            price={deal.price}
            referencePrice={deal.isDeal ? deal.referencePrice : null}
            discountAmount={deal.isDeal ? deal.discountAmount : 0}
          />
        </div>
        <a
          href={link.href}
          target="_blank"
          rel={link.rel}
          aria-label={t(dict.deals.viewAt, {
            name: deal.name,
            shop: deal.shopName,
          })}
          className={cn(
            buttonVariants({ size: "lg" }),
            "relative z-10 h-11 w-full min-w-0 text-base font-bold",
          )}
        >
          {dict.deals.toShop}
          <ExternalLink className="size-4" />
        </a>
      </div>
    </article>
  );
}
