import { Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/core/PageHeader";
import { DealGridSkeleton } from "@/components/deals/DealGrid";
import { DealsBrowser } from "@/components/deals/DealsBrowser";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import { getBrand } from "@/lib/deals";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/merk/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrand(slug);
  const { lang, dict } = await getI18n();
  if (!brand) return { title: dict.brandPage.notFound };
  return {
    title: t(dict.brandPage.metaTitle, { name: brand.name }),
    description: t(dict.brandPage.metaDescription, {
      name: brand.name,
      count: brand.deals,
    }),
    alternates: alternates(lang, `/merk/${brand.slug}`),
  };
}

export default function BrandPage({
  params,
  searchParams,
}: PageProps<"/[lang]/merk/[slug]">) {
  return (
    <Suspense fallback={<BrandSkeleton />}>
      <BrandContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function BrandContent({
  params,
  searchParams,
}: PageProps<"/[lang]/merk/[slug]">) {
  const brand = await getBrand((await params).slug);
  if (!brand) notFound();
  const { dict, href } = await getI18n();
  const b = dict.brandPage;
  return (
    <>
      <PageHeader
        title={t(b.title, { name: brand.name })}
        icon={<Tag className="size-8 text-primary" />}
        description={t(b.description, { name: brand.name })}
        crumbs={[
          { href: "/merken", label: dict.brandsPage.title },
          { href: `/merk/${brand.slug}`, label: brand.name },
        ]}
      >
        <Link
          href={href(`/prijsvergelijker?q=${encodeURIComponent(brand.name)}`)}
          className="w-fit font-semibold text-primary underline"
        >
          {t(b.compare, { name: brand.name })}
        </Link>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<DealGridSkeleton />}>
          <DealsBrowser
            searchParams={searchParams}
            basePath={`/merk/${brand.slug}`}
            fixed={{ brands: brand.variants }}
          />
        </Suspense>
      </div>
    </>
  );
}

function BrandSkeleton() {
  return (
    <>
      <div className="h-48 animate-pulse border-b bg-accent" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <DealGridSkeleton />
      </div>
    </>
  );
}
