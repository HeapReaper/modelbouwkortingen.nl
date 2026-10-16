import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/core/PageHeader";
import { ShopLogo } from "@/components/core/ShopLogo";
import { DealGridSkeleton } from "@/components/deals/DealGrid";
import { DealsBrowser } from "@/components/deals/DealsBrowser";
import { buttonVariants } from "@/components/ui/button";
import { getShop, SHOPS } from "@/lib/shops";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return SHOPS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/webshops/[slug]">): Promise<Metadata> {
  const shop = getShop((await params).slug);
  if (!shop) return {};
  return {
    title: `${shop.name} aanbiedingen`,
    description: `Alle actuele aanbiedingen van ${shop.name} (${shop.domain}) met minstens €5 of 5% korting.`,
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: PageProps<"/webshops/[slug]">) {
  const { slug } = await params;
  const shop = getShop(slug);
  if (!shop) notFound();

  return (
    <>
      <PageHeader
        title={`${shop.name} aanbiedingen`}
        icon={<ShopLogo shop={shop} className="h-11 w-32 rounded-xl" />}
        description={shop.description}
        crumbs={[
          { href: "/webshops", label: "Webshops" },
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
          Naar {shop.domain} <ExternalLink className="size-4" />
        </a>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 py-8">
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
