import { Flame } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/core/PageHeader";
import { DealGridSkeleton } from "@/components/deals/DealGrid";
import { DealsBrowser } from "@/components/deals/DealsBrowser";

export const metadata: Metadata = {
  title: "Alle RC-aanbiedingen",
  description:
    "Alle RC-producten met minstens €5 of 5% korting, van alle webshops op één plek.",
};

export default function AanbiedingenPage({
  searchParams,
}: PageProps<"/aanbiedingen">) {
  return (
    <>
      <PageHeader
        title="Alle aanbiedingen"
        icon={<Flame className="size-8 text-primary" />}
        description="Alle RC-producten die nu minstens €5 of 5% goedkoper zijn. Filter op categorie, webshop, korting of prijs."
        crumbs={[{ href: "/aanbiedingen", label: "Aanbiedingen" }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<DealGridSkeleton />}>
          <DealsBrowser searchParams={searchParams} basePath="/aanbiedingen" />
        </Suspense>
      </div>
    </>
  );
}
