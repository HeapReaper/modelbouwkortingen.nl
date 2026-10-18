import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Info,
  Tag,
  Truck,
  XCircle,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PriceAlertForm } from "@/components/alerts/PriceAlertForm";
import { DealRow } from "@/components/deals/DealRow";
import { DiscountBadge } from "@/components/deals/DiscountBadge";
import { LowestBadge } from "@/components/deals/LowestBadge";
import { PriceBlock } from "@/components/deals/PriceBlock";
import { PriceHistoryChart } from "@/components/deals/PriceHistoryChart";
import { ProductImage } from "@/components/deals/ProductImage";
import { ShopBadge } from "@/components/deals/ShopBadge";
import { buttonVariants } from "@/components/ui/button";
import { WatchButton } from "@/components/watchlist/WatchButton";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { rich, t } from "@/i18n/translate";
import {
  brandSlug,
  type Deal,
  getAlternatives,
  getDeal,
  getPriceHistory,
  getRelatedDeals,
} from "@/lib/deals";
import { SITE_URL } from "@/lib/newsletter-mail";
import { getShop, outLink, shippingCost } from "@/lib/shops";
import { localizeDeals } from "@/lib/translate";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/product/[id]">): Promise<Metadata> {
  const { lang, dict, fmt } = await getI18n();
  const found = await getDeal(Number((await params).id));
  if (!found) return { title: dict.product.notFound };
  const [deal] = await localizeDeals([found], lang);
  const p = dict.product;
  return {
    title: deal.isDeal
      ? t(p.metaTitle, {
          name: deal.name,
          percent: Math.round(deal.discountPercent),
        })
      : deal.name,
    description: t(p.metaDescription, {
      name: deal.name,
      price: fmt.euro(deal.price),
      shop: deal.shopName,
      save:
        deal.isDeal && deal.discountAmount > 0
          ? t(p.metaSave, { amount: fmt.euro(deal.discountAmount) })
          : "",
    }),
    alternates: alternates(lang, `/product/${deal.id}`),
    // Gegenereerde deelafbeelding met foto, prijs en korting (src/app/api/og/[id]).
    openGraph: {
      images: [
        { url: `/api/og/${deal.id}?lang=${lang}`, width: 1200, height: 630 },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/api/og/${deal.id}?lang=${lang}`],
    },
  };
}

export default function ProductPage({
  params,
}: PageProps<"/[lang]/product/[id]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({
  params,
}: {
  params: PageProps<"/[lang]/product/[id]">["params"];
}) {
  const found = await getDeal(Number((await params).id));
  if (!found) notFound();
  const { lang, dict, href, fmt } = await getI18n();
  const [deal] = await localizeDeals([found], lang);
  const p = dict.product;
  const categoryName = dict.categories[deal.categorySlug]?.name;
  const reference = deal.isDeal ? deal.referencePrice : null;
  const link = outLink(deal);
  const shop = getShop(deal.shopSlug);
  const shipping = shippingCost(deal.shopSlug, deal.price);
  // De "van"-prijs van de webshop zelf, naast onze eigen referentieprijs.
  const shopPercent =
    deal.isDeal && deal.oldPrice && deal.oldPrice > deal.price
      ? Math.round(((deal.oldPrice - deal.price) / deal.oldPrice) * 100)
      : null;

  return (
    <div className="flex flex-col gap-14 pb-4">
      <ProductJsonLd deal={deal} url={SITE_URL + href(`/product/${deal.id}`)} />
      <div className="mx-auto w-full max-w-7xl px-4 pt-6">
        <nav
          aria-label={dict.breadcrumb.label}
          className="mb-6 flex flex-wrap items-center gap-1 text-sm font-semibold text-muted-foreground"
        >
          <Link href={href("/")} className="hover:underline">
            {dict.breadcrumb.home}
          </Link>
          <span>/</span>
          {categoryName ? (
            <Link
              href={href(`/categorie/${deal.categorySlug}`)}
              className="hover:underline"
            >
              {categoryName}
            </Link>
          ) : null}
          <span>/</span>
          <Link
            href={href(`/webshops/${deal.shopSlug}`)}
            className="hover:underline"
          >
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
            {deal.isDeal && deal.discountPercent > 0 ? (
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
            {deal.originalName ? (
              <p lang="de" className="-mt-3 text-sm text-muted-foreground">
                {t(p.originalName, { name: deal.originalName })}
              </p>
            ) : null}
            {deal.brand && brandSlug(deal.brand) ? (
              <p className="text-lg text-muted-foreground">
                {rich(p.brand, {
                  brand: (
                    <Link
                      href={href(`/merk/${brandSlug(deal.brand)}`)}
                      className="font-semibold text-foreground underline hover:text-primary"
                    >
                      {deal.brand}
                    </Link>
                  ),
                })}
              </p>
            ) : null}

            <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-accent/60 p-5">
              {deal.isDeal ? (
                <LowestBadge lowest={deal.lowest} className="mb-2 text-sm" />
              ) : (
                <p className="mb-2 text-sm font-semibold text-muted-foreground">
                  {p.noDeal}
                </p>
              )}
              <PriceBlock
                price={deal.price}
                referencePrice={reference}
                discountAmount={deal.isDeal ? deal.discountAmount : 0}
                size="lg"
              />
              {reference && reference > deal.price ? (
                <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  {p.referenceExplained}
                </p>
              ) : null}
              {shopPercent !== null && deal.oldPrice ? (
                shopPercent - deal.discountPercent >= 5 ? (
                  <p className="mt-3 flex items-start gap-2 text-sm font-semibold">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
                    {t(p.claimHigher, {
                      shop: deal.shopName,
                      shopPercent,
                      old: fmt.euro(deal.oldPrice),
                      ourPercent: Math.round(deal.discountPercent),
                    })}
                  </p>
                ) : (
                  <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-savings" />
                    {t(p.claimMatches, { shop: deal.shopName, shopPercent })}
                  </p>
                )
              ) : null}
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <a
                href={link.href}
                target="_blank"
                rel={link.rel}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-14 text-lg font-black",
                )}
              >
                {t(p.viewAt, { shop: deal.shopName })}{" "}
                <ExternalLink className="size-5" />
              </a>
              <WatchButton
                id={deal.id}
                name={deal.name}
                full
                className="h-14"
              />
            </div>

            <ul className="flex flex-col gap-3 text-base">
              <li className="flex items-center gap-2">
                {deal.inStock === false ? (
                  <>
                    <XCircle className="size-5 text-destructive" />{" "}
                    {p.outOfStock}
                  </>
                ) : deal.inStock ? (
                  <>
                    <CheckCircle2 className="size-5 text-savings" /> {p.inStock}
                  </>
                ) : (
                  <>
                    <Info className="size-5 text-muted-foreground" />{" "}
                    {p.stockUnknown}
                  </>
                )}
              </li>
              {deal.dealSince ? (
                <li className="flex items-center gap-2">
                  <Clock className="size-5 text-muted-foreground" />{" "}
                  {t(p.dealSince, {
                    date: fmt.dateTime(deal.dealSince),
                    ago: fmt.timeAgo(deal.dealSince) ?? "",
                  })}
                </li>
              ) : null}
              {shop?.country ? (
                <li className="flex items-center gap-2">
                  <Globe className="size-5 text-muted-foreground" />
                  {t(p.shopCountry, { country: fmt.country(shop.country) })}
                </li>
              ) : null}
              {shipping !== null ? (
                <li className="flex items-center gap-2">
                  <Truck className="size-5 text-muted-foreground" />
                  {shipping === 0
                    ? p.shippingFree
                    : t(p.shipping, {
                        cost: fmt.euro(shipping),
                        total: fmt.euro(deal.price + shipping),
                      })}
                </li>
              ) : null}
              {deal.shopCategory ? (
                <li className="flex items-center gap-2">
                  <Tag className="size-5 text-muted-foreground" />
                  <span className="line-clamp-1">
                    {t(p.shopCategory, { category: deal.shopCategory })}
                  </span>
                </li>
              ) : null}
            </ul>
            <p className="text-sm text-muted-foreground">
              {t(p.disclaimer, { shop: deal.shopName })}
            </p>
          </div>
        </div>

        <Suspense fallback={null}>
          <Alternatives deal={deal} />
        </Suspense>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <section className="min-w-0 rounded-2xl border bg-card p-5">
            <h2 className="mb-4 text-2xl font-black">{p.history}</h2>
            <Suspense
              fallback={
                <div className="h-64 animate-pulse rounded-xl bg-muted" />
              }
            >
              <History id={deal.id} />
            </Suspense>
          </section>
          <PriceAlertForm
            key={lang}
            productId={deal.id}
            price={deal.price}
            className="self-start"
          />
        </div>
      </div>

      <Suspense fallback={null}>
        <Related deal={deal} />
      </Suspense>
    </div>
  );
}

/** Hetzelfde artikelnummer bij andere webshops (zie getAlternatives()). */
async function Alternatives({ deal }: { deal: Deal }) {
  const { lang, dict, href, fmt } = await getI18n();
  const others = await localizeDeals(await getAlternatives(deal), lang);
  if (others.length === 0) return null;
  const p = dict.product;
  const c = dict.comparePage;
  const all = [deal, ...others].sort((a, b) => a.price - b.price);
  const cheapest = all[0];
  return (
    <section className="mt-12 rounded-2xl border bg-card p-5">
      <h2 className="text-2xl font-black">{p.alternatives}</h2>
      <p className="mb-4 text-muted-foreground">
        {t(p.alternativesText, { sku: deal.sku ?? "" })}
      </p>
      <ol className="divide-y rounded-xl border">
        {all.map((o) => {
          const self = o.id === deal.id;
          const link = outLink(o);
          const shipping = shippingCost(o.shopSlug, o.price);
          return (
            <li
              key={o.id}
              className={cn(
                "flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5",
                self && "bg-accent/60",
              )}
            >
              <ShopBadge
                slug={o.shopSlug}
                name={o.shopName}
                className="min-w-0 flex-1 basis-40"
              />
              <span className="flex items-center gap-2 text-sm">
                {self ? (
                  <span className="font-semibold">{p.thisOffer}</span>
                ) : null}
                {o.inStock === false ? (
                  <span className="text-muted-foreground">{c.outOfStock}</span>
                ) : null}
                {o.isDeal && o.discountPercent > 0 ? (
                  <span className="rounded bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
                    {t(c.deal, { percent: Math.round(o.discountPercent) })}
                  </span>
                ) : null}
              </span>
              <span className="ml-auto flex items-baseline gap-2 tabular-nums">
                {o.id === cheapest.id ? (
                  <span className="text-xs font-bold text-savings uppercase">
                    {c.cheapest}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    +{fmt.euro(o.price - cheapest.price)}
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
                {self ? null : (
                  <Link
                    href={href(`/product/${o.id}`)}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    {c.history}
                  </Link>
                )}
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
    </section>
  );
}

/** Structured data voor zoekmachines (Product + Offer, schema.org). */
function ProductJsonLd({ deal, url }: { deal: Deal; url: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: deal.name,
    url,
    ...(deal.imageUrl ? { image: [deal.imageUrl] } : {}),
    ...(deal.brand ? { brand: { "@type": "Brand", name: deal.brand } } : {}),
    ...(deal.sku ? { sku: deal.sku } : {}),
    offers: {
      "@type": "Offer",
      url: deal.url,
      price: deal.price.toFixed(2),
      priceCurrency: "EUR",
      itemCondition: "https://schema.org/NewCondition",
      ...(deal.inStock === null
        ? {}
        : {
            availability: deal.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          }),
      seller: { "@type": "Organization", name: deal.shopName },
    },
  };
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD; "<" wordt ge-escaped.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}

async function History({ id }: { id: number }) {
  const points = await getPriceHistory(id);
  if (points.length < 2) {
    const { dict } = await getI18n();
    return <p className="text-muted-foreground">{dict.product.historyEmpty}</p>;
  }
  return <PriceHistoryChart points={points} />;
}

async function Related({ deal }: { deal: Deal }) {
  const { lang, dict } = await getI18n();
  const related = await localizeDeals(await getRelatedDeals(deal), lang);
  if (related.length === 0) return null;
  return (
    <DealRow
      title={t(dict.product.related, {
        category:
          dict.categories[deal.categorySlug]?.name ??
          dict.product.relatedFallback,
      })}
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
