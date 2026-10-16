import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/core/PageHeader";
import { SearchForm } from "@/components/core/SearchForm";
import { DealGridSkeleton } from "@/components/deals/DealGrid";
import { DealsBrowser } from "@/components/deals/DealsBrowser";

export const metadata: Metadata = {
  title: "Zoeken",
  description: "Zoek tussen alle RC-aanbiedingen.",
  robots: { index: false },
};

export default function ZoekenPage({ searchParams }: PageProps<"/zoeken">) {
  return (
    <>
      <PageHeader
        title="Zoeken"
        crumbs={[{ href: "/zoeken", label: "Zoeken" }]}
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
  searchParams: PageProps<"/zoeken">["searchParams"];
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
