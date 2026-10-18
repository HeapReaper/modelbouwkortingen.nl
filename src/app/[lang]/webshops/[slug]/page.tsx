import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/core/PageHeader";
import { ShopLogo } from "@/components/core/ShopLogo";
import { DealGridSkeleton } from "@/components/deals/DealGrid";
import { DealsBrowser } from "@/components/deals/DealsBrowser";
import { FeaturedDeals } from "@/components/promo/FeaturedDeals";
import { buttonVariants } from "@/components/ui/button";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import { getShop, SHOPS } from "@/lib/shops";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return SHOPS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/webshops/[slug]">): Promise<Metadata> {
  const shop = getShop((await params).slug);
  if (!shop) return {};
  const { lang, dict } = await getI18n();
  return {
    title: t(dict.shopPage.title, { name: shop.name }),
    description: t(dict.shopPage.metaDescription, {
      name: shop.name,
      domain: shop.domain,
    }),
    alternates: alternates(lang, `/webshops/${shop.slug}`),
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: PageProps<"/[lang]/webshops/[slug]">) {
  const { slug } = await params;
  const shop = getShop(slug);
  if (!shop) notFound();
  const { dict } = await getI18n();

  return (
    <>
      <PageHeader
        title={t(dict.shopPage.title, { name: shop.name })}
        icon={<ShopLogo shop={shop} className="h-11 w-32 rounded-xl" />}
        description={dict.shops[slug]}
        crumbs={[
          { href: "/webshops", label: dict.shopsPage.title },
          { href: `/webshops/${slug}`, label: shop.name },
        ]}
      >
        <a
          href={shop.url}
          target="_blank"
          rel="noopener nofollow"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-11 w-fit bg-background text-base",
          )}
        >
          {t(dict.shopPage.visit, { domain: shop.domain })}{" "}
          <ExternalLink className="size-4" />
        </a>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={null}>
          <FeaturedDeals shop={shop.slug} className="mb-10 px-0" />
        </Suspense>
        <Suspense fallback={<DealGridSkeleton />}>
          <DealsBrowser
            searchParams={searchParams}
            basePath={`/webshops/${slug}`}
            fixed={{ shop: slug }}
          />
        </Suspense>
      </div>
    </>
  );
}
