import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Tag,
  XCircle,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DealRow } from "@/components/deals/DealRow";
import { DiscountBadge } from "@/components/deals/DiscountBadge";
import { PriceBlock } from "@/components/deals/PriceBlock";
import { PriceHistoryChart } from "@/components/deals/PriceHistoryChart";
import { ProductImage } from "@/components/deals/ProductImage";
import { ShopBadge } from "@/components/deals/ShopBadge";
import { buttonVariants } from "@/components/ui/button";
import { getCategory } from "@/lib/categories";
import {
  type Deal,
  getDeal,
  getPriceHistory,
  getRelatedDeals,
} from "@/lib/deals";
import { formatDateTime, formatEuro, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/product/[id]">): Promise<Metadata> {
  const deal = await getDeal(Number((await params).id));
  if (!deal) return { title: "Product niet gevonden" };
  return {
    title: `${deal.name} — ${Math.round(deal.discountPercent)}% korting`,
    description: `${deal.name} nu voor ${formatEuro(deal.price)} bij ${deal.shopName}${
      deal.discountAmount > 0
        ? ` (je bespaart ${formatEuro(deal.discountAmount)})`
        : ""
    }.`,
    openGraph: deal.imageUrl ? { images: [deal.imageUrl] } : undefined,
  };
}

export default function ProductPage({ params }: PageProps<"/product/[id]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({
  params,
}: {
  params: PageProps<"/product/[id]">["params"];
}) {
  const deal = await getDeal(Number((await params).id));
  if (!deal) notFound();
  const category = getCategory(deal.categorySlug);
  const reference = deal.referencePrice ?? deal.oldPrice;
  const fromShop = deal.oldPrice !== null && reference === deal.oldPrice;

  return (
    <div className="flex flex-col gap-14 pb-4">
      <div className="mx-auto w-full max-w-7xl px-4 pt-6">
        <nav
          aria-label="Kruimelpad"
          className="mb-6 flex flex-wrap items-center gap-1 text-sm font-semibold text-muted-foreground"
        >
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          {category ? (
            <Link
              href={`/categorie/${category.slug}`}
              className="hover:underline"
            >
              {category.name}
            </Link>
          ) : null}
          <span>/</span>
          <Link href={`/webshops/${deal.shopSlug}`} className="hover:underline">
            {deal.shopName}
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl border bg-white">
            <ProductImage
              src={deal.imageUrl}
              alt={deal.name}
              categorySlug={deal.categorySlug}
              eager
              className="aspect-square w-full p-6"
            />
            {deal.discountPercent > 0 ? (
              <DiscountBadge
                percent={deal.discountPercent}
                size="lg"
                className="absolute top-5 right-0"
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-5">
            <ShopBadge
              slug={deal.shopSlug}
              name={deal.shopName}
              className="text-base"
            />
            <h1 className="text-3xl leading-tight font-black tracking-tight sm:text-4xl">
              {deal.name}
            </h1>
            {deal.brand ? (
              <p className="text-lg text-muted-foreground">
                Merk: {deal.brand}
              </p>
            ) : null}

            <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-accent/60 p-5">
              <PriceBlock
                price={deal.price}
                referencePrice={reference}
                discountAmount={deal.discountAmount}
                size="lg"
              />
              {reference && reference > deal.price ? (
                <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  {fromShop
                    ? `De doorgestreepte prijs is de "van"-prijs die ${deal.shopName} zelf vermeldt.`
                    : "De doorgestreepte prijs is de hoogste prijs die wij de afgelopen 30 dagen bij deze webshop zagen."}
                </p>
              ) : null}
            </div>

            <a
              href={deal.url}
              target="_blank"
              rel="noopener nofollow"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-14 text-lg font-black",
              )}
            >
              Bekijk bij {deal.shopName} <ExternalLink className="size-5" />
            </a>

            <ul className="flex flex-col gap-3 text-base">
              <li className="flex items-center gap-2">
                {deal.inStock === false ? (
                  <>
                    <XCircle className="size-5 text-destructive" /> Niet op
                    voorraad bij de webshop
                  </>
                ) : deal.inStock ? (
                  <>
                    <CheckCircle2 className="size-5 text-savings" /> Op voorraad
                  </>
                ) : (
                  <>
                    <Info className="size-5 text-muted-foreground" /> Voorraad:
                    kijk bij de webshop
                  </>
                )}
              </li>
              {deal.dealSince ? (
                <li className="flex items-center gap-2">
                  <Clock className="size-5 text-muted-foreground" /> In de
                  aanbieding sinds {formatDateTime(deal.dealSince)} (
                  {timeAgo(deal.dealSince)})
                </li>
              ) : null}
              {deal.shopCategory ? (
                <li className="flex items-center gap-2">
                  <Tag className="size-5 text-muted-foreground" />
                  <span className="line-clamp-1">
                    Categorie bij webshop: {deal.shopCategory}
                  </span>
                </li>
              ) : null}
            </ul>
            <p className="text-sm text-muted-foreground">
              Prijzen worden automatisch verzameld en kunnen inmiddels gewijzigd
              zijn. De prijs op de website van {deal.shopName} is altijd
              leidend.
            </p>
          </div>
        </div>

        <section className="mt-12 rounded-2xl border bg-card p-5">
          <h2 className="mb-4 text-2xl font-black">Prijsverloop</h2>
          <Suspense
            fallback={
              <div className="h-64 animate-pulse rounded-xl bg-muted" />
            }
          >
            <History id={deal.id} />
          </Suspense>
        </section>
      </div>

      <Suspense fallback={null}>
        <Related deal={deal} />
      </Suspense>
    </div>
  );
}

async function History({ id }: { id: number }) {
  const points = await getPriceHistory(id);
  if (points.length < 2) {
    return (
      <p className="text-muted-foreground">
        We volgen dit product nog niet lang genoeg voor een grafiek. Kom later
        terug!
      </p>
    );
  }
  return <PriceHistoryChart points={points} />;
}

async function Related({ deal }: { deal: Deal }) {
  const related = await getRelatedDeals(deal);
  if (related.length === 0) return null;
  const category = getCategory(deal.categorySlug);
  return (
    <DealRow
      title={`Meer ${category?.name ?? "deals"} met korting`}
      href={`/categorie/${deal.categorySlug}`}
      deals={related}
    />
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-14 lg:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
      <div className="flex flex-col gap-4">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
        <div className="h-32 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
