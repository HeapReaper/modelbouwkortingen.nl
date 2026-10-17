import { Flame } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/core/PageHeader";
import { DealGridSkeleton } from "@/components/deals/DealGrid";
import { DealsBrowser } from "@/components/deals/DealsBrowser";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, dict } = await getI18n();
  return {
    title: dict.dealsPage.metaTitle,
    description: dict.dealsPage.metaDescription,
    alternates: alternates(lang, "/aanbiedingen"),
  };
}

export default async function AanbiedingenPage({
  searchParams,
}: PageProps<"/[lang]/aanbiedingen">) {
  const { dict } = await getI18n();
  return (
    <>
      <PageHeader
        title={dict.dealsPage.title}
        icon={<Flame className="size-8 text-primary" />}
        description={dict.dealsPage.description}
        crumbs={[{ href: "/aanbiedingen", label: dict.dealsPage.crumb }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<DealGridSkeleton />}>
          <DealsBrowser searchParams={searchParams} basePath="/aanbiedingen" />
        </Suspense>
      </div>
    </>
  );
}
