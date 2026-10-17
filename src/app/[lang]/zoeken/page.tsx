import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/core/PageHeader";
import { SearchForm } from "@/components/core/SearchForm";
import { DealGridSkeleton } from "@/components/deals/DealGrid";
import { DealsBrowser } from "@/components/deals/DealsBrowser";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return {
    title: dict.searchPage.title,
    description: dict.searchPage.metaDescription,
    robots: { index: false },
  };
}

export default async function ZoekenPage({
  searchParams,
}: PageProps<"/[lang]/zoeken">) {
  const { dict } = await getI18n();
  return (
    <>
      <PageHeader
        title={dict.searchPage.title}
        crumbs={[{ href: "/zoeken", label: dict.searchPage.title }]}
      >
        <Suspense fallback={<SearchForm size="lg" className="max-w-2xl" />}>
          <SearchBox searchParams={searchParams} />
        </Suspense>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<DealGridSkeleton />}>
          <DealsBrowser searchParams={searchParams} basePath="/zoeken" />
        </Suspense>
      </div>
    </>
  );
}

async function SearchBox({
  searchParams,
}: {
  searchParams: PageProps<"/[lang]/zoeken">["searchParams"];
}) {
  const { q } = await searchParams;
  const value = Array.isArray(q) ? q[0] : q;
  return (
    <SearchForm
      size="lg"
      defaultValue={value}
      autoFocus={!value}
      className="max-w-2xl"
      key={value}
    />
  );
}
