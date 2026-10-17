import { Flame, Sparkles } from "lucide-react";
import { Suspense } from "react";
import { DealGridSkeleton } from "@/components/deals/DealGrid";
import { DealRow } from "@/components/deals/DealRow";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ShopCards } from "@/components/home/ShopCards";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { getNewestDeals, getTopDeals } from "@/lib/deals";

export default function Home() {
  return (
    <div className="flex flex-col gap-14 pb-4 sm:gap-20">
      <Hero />

      <Suspense fallback={<RowSkeleton />}>
        <TopDealsRow />
      </Suspense>

      <Suspense fallback={<RowSkeleton />}>
        <NewestDealsRow />
      </Suspense>

      <NewsletterSignup />

      <CategoryGrid />
      <ShopCards />
      <HowItWorks />
    </div>
  );
}

async function TopDealsRow() {
  const deals = await getTopDeals(12);
  return (
    <DealRow
      title="Grootste kortingen"
      subtitle="De hoogste kortingspercentages van dit moment"
      href="/aanbiedingen?sort=korting"
      deals={deals}
      icon={<Flame className="size-7 text-primary" />}
    />
  );
}

async function NewestDealsRow() {
  const deals = await getNewestDeals(12);
  return (
    <DealRow
      title="Net binnen"
      subtitle="Vers gespotte aanbiedingen"
      href="/aanbiedingen?sort=nieuw"
      deals={deals}
      icon={<Sparkles className="size-7 text-primary" />}
    />
  );
}

function RowSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4">
      <div className="mb-4 h-9 w-64 animate-pulse rounded bg-muted" />
      <DealGridSkeleton count={4} />
    </div>
  );
}
