import { ArrowRight, ExternalLink, Store } from "lucide-react";
import Link from "next/link";
import { ShopLogo } from "@/components/core/ShopLogo";
import { SponsoredBadge } from "@/components/promo/SponsoredBadge";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import { getFeaturedShops } from "@/lib/promotions";
import { shopOutLink } from "@/lib/shops";
import { cn } from "@/lib/utils";

/**
 * Uitgelichte webshops (betaalde plaatsingen) met een knop naar hun aanbiedingen op de site en
 * een knop naar de webshop zelf (telt als "featured"-klik). Zonder lopende promoties rendert
 * dit niets. Leest de database: binnen <Suspense>.
 */
export async function FeaturedShops({ className }: { className?: string }) {
  const shops = await getFeaturedShops();
  if (shops.length === 0) return null;
  const { dict, href } = await getI18n();
  return (
    <section className={cn("mx-auto w-full max-w-7xl px-4", className)}>
      <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
        <Store className="size-7 text-primary" />
        {dict.promo.shopsTitle}
      </h2>
      <p className="mt-1 text-muted-foreground">{dict.promo.shopsSubtitle}</p>
      <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shops.map((s) => {
          const out = shopOutLink(s.slug);
          return (
            <li
              key={s.slug}
              className="flex h-full flex-col gap-4 rounded-2xl border-2 border-primary/30 bg-card p-5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ShopLogo shop={s} className="h-12 w-32 rounded-xl" />
                  <div className="min-w-0">
                    <p className="text-lg font-bold break-words">{s.name}</p>
                    <p className="text-sm break-words text-muted-foreground">{s.domain}</p>
                  </div>
                </div>
                <SponsoredBadge className="shrink-0" />
              </div>
              <p className="text-muted-foreground">{dict.shops[s.slug]}</p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  href={href(`/webshops/${s.slug}`)}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "flex-1 font-bold",
                  )}
                >
                  {dict.promo.viewDeals} <ArrowRight className="size-4" />
                </Link>
                <a
                  href={out.href}
                  target="_blank"
                  rel={out.rel}
                  className={cn(buttonVariants(), "flex-1 font-bold")}
                >
                  {dict.promo.visitShop} <ExternalLink className="size-4" />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
