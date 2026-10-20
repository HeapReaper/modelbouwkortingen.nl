import { Car, Flame, Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { DealGridSkeleton } from "@/components/deals/DealGrid";
import { DealRow } from "@/components/deals/DealRow";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ShopCards } from "@/components/home/ShopCards";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { FeaturedDeals } from "@/components/promo/FeaturedDeals";
import { FeaturedShops } from "@/components/promo/FeaturedShops";
import { getI18n } from "@/i18n/server";
import { getCategory, RC_MODEL_CATEGORIES } from "@/lib/categories";
import { getNewestDeals, getTopDeals } from "@/lib/deals";
import { localizeDeals } from "@/lib/translate";

export default function Home() {
  return (
    <div className="flex flex-col gap-14 pb-4 sm:gap-20">
      <Hero />

      {/* Betaalde plaatsingen; zonder lopende promoties rendert dit niets. */}
      <Suspense fallback={null}>
        <FeaturedDeals />
      </Suspense>

      <Suspense fallback={<RowSkeleton />}>
        <RcModelsRow />
      </Suspense>

      <Suspense fallback={<RowSkeleton />}>
        <TopDealsRow />
      </Suspense>

      <Suspense fallback={<RowSkeleton />}>
        <NewestDealsRow />
      </Suspense>

      <NewsletterSignup />

      <CategoryGrid />
      <Suspense fallback={null}>
        <FeaturedShops />
      </Suspense>
      <ShopCards />
      <HowItWorks />
    </div>
  );
}

async function RcModelsRow() {
  const { lang, dict, href } = await getI18n();
  const deals = await localizeDeals(
    await getTopDeals(12, RC_MODEL_CATEGORIES),
    lang,
  );
  return (
    <DealRow
      title={dict.home.rcTitle}
      subtitle={dict.home.rcSubtitle}
      deals={deals}
      icon={<Car className="size-7 text-primary" />}
    >
      {/* /aanbiedingen filtert op één categorie, dus een link per categorie. */}
      <div className="flex flex-wrap gap-2">
        {RC_MODEL_CATEGORIES.map((slug) => {
          const Icon = getCategory(slug)?.icon ?? Car;
          return (
            <Link
              key={slug}
              href={href(`/categorie/${slug}`)}
              className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-semibold hover:border-primary hover:text-primary"
            >
              <Icon className="size-4 text-primary" />
              {dict.categories[slug].name}
            </Link>
          );
        })}
      </div>
    </DealRow>
  );
}

async function TopDealsRow() {
  const { lang, dict } = await getI18n();
  const deals = await localizeDeals(await getTopDeals(12), lang);
  return (
    <DealRow
      title={dict.home.topTitle}
      subtitle={dict.home.topSubtitle}
      href="/aanbiedingen?sort=korting"
      deals={deals}
      icon={<Flame className="size-7 text-primary" />}
    />
  );
}

async function NewestDealsRow() {
  const { lang, dict } = await getI18n();
  const deals = await localizeDeals(await getNewestDeals(12), lang);
  return (
    <DealRow
      title={dict.home.newTitle}
      subtitle={dict.home.newSubtitle}
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
