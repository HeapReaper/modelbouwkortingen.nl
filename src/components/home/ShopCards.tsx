import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ShopLogo } from "@/components/core/ShopLogo";
import { getSiteStats } from "@/lib/deals";
import { formatNumber } from "@/lib/format";
import { SHOPS } from "@/lib/shops";

export function ShopCards({
  title = "Webshops die wij in de gaten houden",
}: {
  title?: string;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4">
      <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
        {title}
      </h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {SHOPS.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/webshops/${s.slug}`}
              className="group flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <ShopLogo shop={s} className="h-12 w-32 rounded-xl" />
                <div>
                  <p className="text-lg font-bold">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.domain}</p>
                </div>
              </div>
              <p className="text-muted-foreground">{s.description}</p>
              <p className="mt-auto flex items-center justify-between font-bold text-primary">
                <Suspense fallback={<span>Deals bekijken</span>}>
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
  const stats = await getSiteStats();
  return <span>{formatNumber(stats.byShop[slug] ?? 0)} deals bekijken</span>;
}
