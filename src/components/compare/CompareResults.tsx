import { ExternalLink, LineChart, Trophy } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/deals/ProductImage";
import { ShopBadge } from "@/components/deals/ShopBadge";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import type { CompareGroup } from "@/lib/compare";
import { outLink, shippingCost } from "@/lib/shops";
import { cn } from "@/lib/utils";

/** Eén product met al zijn aanbieders, goedkoopste eerst. */
export async function CompareCard({ group }: { group: CompareGroup }) {
  const { dict, href, fmt } = await getI18n();
  const c = dict.comparePage;
  const [cheapest] = group.offers;
  const best = outLink(cheapest);
  const n = group.offers.length;

  return (
    <article className="grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-[9rem_1fr] sm:p-5">
      <ProductImage
        src={group.imageUrl}
        alt={group.name}
        categorySlug={group.categorySlug}
        className="aspect-square w-28 rounded-xl sm:w-full"
      />
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg leading-snug font-bold">
            <Link
              href={href(`/product/${cheapest.id}`)}
              className="hover:underline"
            >
              {group.name}
            </Link>
          </h2>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {group.sku ? <span>{t(c.sku, { sku: group.sku })}</span> : null}
            <span>{n === 1 ? c.shopsOne : t(c.shopsOther, { count: n })}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent/70 p-3">
          <div>
            <p className="font-heading text-3xl font-black tabular-nums">
              {fmt.euro(cheapest.price)}
            </p>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Trophy className="size-4 text-primary" />
              {t(c.cheapestAt, { shop: cheapest.shopName })}
            </p>
          </div>
          <a
            href={best.href}
            target="_blank"
            rel={best.rel}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 text-base font-bold",
            )}
          >
            {c.toShop} <ExternalLink className="size-4" />
          </a>
        </div>

        <ol className="divide-y rounded-xl border">
          {group.offers.map((o, i) => {
            const link = outLink(o);
            const diff = o.price - cheapest.price;
            const shipping = shippingCost(o.shopSlug, o.price);
            return (
              <li
                key={o.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5"
              >
                <ShopBadge
                  slug={o.shopSlug}
                  name={o.shopName}
                  className="min-w-0 flex-1 basis-40"
                />
                <span className="flex items-center gap-2 text-sm">
                  {o.inStock === false ? (
                    <span className="text-muted-foreground">
                      {c.outOfStock}
                    </span>
                  ) : o.inStock ? (
                    <span className="text-savings">{c.inStockLabel}</span>
                  ) : null}
                  {o.isDeal && o.discountPercent > 0 ? (
                    <span className="rounded bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
                      {t(c.deal, { percent: Math.round(o.discountPercent) })}
                    </span>
                  ) : null}
                </span>
                <span className="ml-auto flex items-baseline gap-2 tabular-nums">
                  {i === 0 ? (
                    <span className="text-xs font-bold text-savings uppercase">
                      {c.cheapest}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      +{fmt.euro(diff)}
                    </span>
                  )}
                  <span className="text-lg font-bold">{fmt.euro(o.price)}</span>
                  {shipping ? (
                    <span className="text-xs text-muted-foreground">
                      {t(c.plusShipping, { cost: fmt.euro(shipping) })}
                    </span>
                  ) : null}
                </span>
                <span className="flex items-center gap-1">
                  <Link
                    href={href(`/product/${o.id}`)}
                    aria-label={c.history}
                    title={c.history}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon",
                    })}
                  >
                    <LineChart className="size-4" />
                  </Link>
                  <a
                    href={link.href}
                    target="_blank"
                    rel={link.rel}
                    aria-label={`${c.toShop}: ${o.shopName}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "icon",
                    })}
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </article>
  );
}
