import { Heart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/core/PageHeader";
import { DealGrid, DealGridSkeleton } from "@/components/deals/DealGrid";
import { buttonVariants } from "@/components/ui/button";
import { WatchlistSync } from "@/components/watchlist/WatchlistSync";
import { getI18n } from "@/i18n/server";
import { getDealsByIds } from "@/lib/deals";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.watchlist.title, robots: { index: false } };
}

export default async function WatchlistPage({
  searchParams,
}: PageProps<"/[lang]/volglijst">) {
  const { dict } = await getI18n();
  const w = dict.watchlist;
  return (
    <>
      <PageHeader
        title={w.title}
        icon={<Heart className="size-8 text-primary" />}
        description={w.description}
        crumbs={[{ href: "/volglijst", label: w.title }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<DealGridSkeleton count={4} />}>
          <Watchlist searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Watchlist({
  searchParams,
}: {
  searchParams: PageProps<"/[lang]/volglijst">["searchParams"];
}) {
  const { dict, href } = await getI18n();
  const w = dict.watchlist;
  const raw = (await searchParams).ids;
  const current = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const ids = current
    .split(",")
    .map(Number)
    .filter((n) => Number.isSafeInteger(n) && n > 0);
  const deals = await getDealsByIds(ids);

  return (
    <div className="flex flex-col gap-6">
      <WatchlistSync current={ids.join(",")} />
      {deals.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-10 text-center">
          <Heart className="size-10 text-primary" />
          <p className="max-w-lg text-lg text-muted-foreground">{w.empty}</p>
          <Link
            href={href("/aanbiedingen")}
            className={buttonVariants({ size: "lg" })}
          >
            {dict.deals.emptyCta}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground">{w.hint}</p>
          <DealGrid deals={deals} />
        </>
      )}
    </div>
  );
}
