import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ShopLogo } from "@/components/core/ShopLogo";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import { getSiteStats } from "@/lib/deals";
import { SHOPS } from "@/lib/shops";

export async function ShopCards({ title }: { title?: string }) {
  const { dict, href } = await getI18n();
  return (
    <section className="mx-auto w-full max-w-7xl px-4">
      <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
        {title ?? dict.home.shopsTitle}
      </h2>
      <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {SHOPS.map((s) => (
          <li key={s.slug}>
            <Link
              href={href(`/webshops/${s.slug}`)}
              className="group flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <ShopLogo shop={s} className="h-12 w-32 rounded-xl" />
                <div className="min-w-0">
                  <p className="text-lg font-bold break-words">{s.name}</p>
                  <p className="text-sm break-words text-muted-foreground">{s.domain}</p>
                </div>
              </div>
              <p className="text-muted-foreground">{dict.shops[s.slug]}</p>
              <p className="mt-auto flex items-center justify-between font-bold text-primary">
                <Suspense fallback={<span>{dict.home.shopDealsFallback}</span>}>
                  <ShopCount slug={s.slug} />
                </Suspense>
                <ArrowRight className="size-5 transition group-hover:translate-x-1" />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function ShopCount({ slug }: { slug: string }) {
  const { dict, fmt } = await getI18n();
  const stats = await getSiteStats();
  return (
    <span>
      {t(dict.home.shopDeals, { count: fmt.number(stats.byShop[slug] ?? 0) })}
    </span>
  );
}
