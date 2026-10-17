import { BadgePercent, Clock, PackageSearch, Store } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { SearchForm } from "@/components/core/SearchForm";
import { DiscountBadge } from "@/components/deals/DiscountBadge";
import { PriceBlock } from "@/components/deals/PriceBlock";
import { ProductImage } from "@/components/deals/ProductImage";
import { ShopBadge } from "@/components/deals/ShopBadge";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import { getSiteStats, getTopDeals } from "@/lib/deals";

const QUICK_SEARCHES = [
  "Arrma",
  "Traxxas",
  "LiPo 4S",
  "Crawler",
  "DJI",
  "Spektrum",
];

export async function Hero() {
  const { dict, href } = await getI18n();
  const h = dict.home;
  return (
    <section className="relative overflow-hidden border-b bg-accent">
      <div
        className="bg-sale-stripes absolute inset-0 opacity-60"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:py-14 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:py-20">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit -rotate-1 items-center gap-2 rounded-md bg-primary px-3 py-1.5 font-heading text-sm font-black tracking-wider text-primary-foreground uppercase shadow-md">
            <BadgePercent className="size-4" /> {h.badge}
          </span>
          <h1 className="text-4xl leading-[1.05] font-black tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {h.titleStart}{" "}
            <span className="relative inline-block text-primary">
              {h.titleHighlight}
              <svg
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 h-3 w-full text-deal"
                aria-hidden="true"
              >
                <path
                  d="M2 9c60-6 140-8 296-4"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="max-w-xl text-lg text-pretty text-foreground/80 sm:text-xl">
            {h.intro}
          </p>
          <SearchForm size="lg" className="max-w-2xl" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">
              {h.popular}
            </span>
            {QUICK_SEARCHES.map((q) => (
              <Link
                key={q}
                href={href(`/zoeken?q=${encodeURIComponent(q)}`)}
                className="rounded-full border bg-background/80 px-3 py-1 text-sm font-semibold hover:border-primary hover:text-primary"
              >
                {q}
              </Link>
            ))}
          </div>
          <Suspense fallback={<div className="h-10" />}>
            <HeroStats />
          </Suspense>
        </div>
        <Suspense
          fallback={
            <div className="hidden aspect-square rounded-3xl bg-background/60 lg:block" />
          }
        >
          <FeaturedDeal />
        </Suspense>
      </div>
    </section>
  );
}

async function HeroStats() {
  const { dict, fmt } = await getI18n();
  const h = dict.home;
  const stats = await getSiteStats();
  const items = [
    {
      icon: BadgePercent,
      label:
        stats.deals === 1
          ? h.statDealsOne
          : t(h.statDeals, { count: fmt.number(stats.deals) }),
    },
    {
      icon: PackageSearch,
      label:
        stats.products === 1
          ? h.statProductsOne
          : t(h.statProducts, { count: fmt.number(stats.products) }),
    },
    {
      icon: Store,
      label:
        stats.shops === 1
          ? h.statShopsOne
          : t(h.statShops, { count: stats.shops }),
    },
    ...(stats.maxDiscount > 0
      ? [
          {
            icon: BadgePercent,
            label: t(h.statMaxDiscount, { percent: stats.maxDiscount }),
          },
        ]
      : []),
    ...(stats.lastUpdate
      ? [
          {
            icon: Clock,
            label: t(h.statUpdated, {
              ago: fmt.timeAgo(stats.lastUpdate) ?? "",
            }),
          },
        ]
      : []),
  ];
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-base font-semibold">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <it.icon className="size-5 text-primary" /> {it.label}
        </li>
      ))}
    </ul>
  );
}

async function FeaturedDeal() {
  const { dict, href, fmt } = await getI18n();
  const [deal] = await getTopDeals(1);
  if (!deal) return null;
  return (
    <Link
      href={href(`/product/${deal.id}`)}
      className="group relative hidden rotate-1 flex-col overflow-hidden rounded-3xl border-4 border-foreground bg-card shadow-[10px_10px_0_0_var(--foreground)] transition hover:rotate-0 lg:flex"
    >
      <span className="absolute top-0 left-0 z-10 rounded-br-2xl bg-deal px-4 py-2 font-heading text-sm font-black tracking-wider text-deal-foreground uppercase">
        {dict.home.featured}
      </span>
      <ProductImage
        src={deal.imageUrl}
        alt={deal.name}
        categorySlug={deal.categorySlug}
        eager
        className="aspect-[4/3] w-full"
      />
      <DiscountBadge
        percent={deal.discountPercent}
        size="lg"
        className="absolute top-14 right-0"
      />
      <div className="flex flex-col gap-2 p-5">
        <ShopBadge
          slug={deal.shopSlug}
          name={deal.shopName}
          className="text-muted-foreground"
        />
        <p className="line-clamp-2 text-lg font-bold group-hover:underline">
          {deal.name}
        </p>
        <PriceBlock
          price={deal.price}
          referencePrice={deal.referencePrice}
          discountAmount={deal.discountAmount}
        />
        <p className="sr-only">
          {t(dict.home.saveSr, { amount: fmt.euro(deal.discountAmount) })}
        </p>
      </div>
    </Link>
  );
}
