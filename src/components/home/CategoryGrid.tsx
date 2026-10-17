import Link from "next/link";
import { Suspense } from "react";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import { CATEGORIES } from "@/lib/categories";
import { getSiteStats } from "@/lib/deals";

export async function CategoryGrid() {
  const { dict, href } = await getI18n();
  return (
    <section className="mx-auto w-full max-w-7xl px-4">
      <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
        {dict.home.categoriesTitle}
      </h2>
      <p className="mt-1 text-muted-foreground">
        {dict.home.categoriesSubtitle}
      </p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Link
              href={href(`/categorie/${c.slug}`)}
              className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <c.icon className="size-6" />
              </span>
              <span className="text-base leading-tight font-bold">
                {dict.categories[c.slug].name}
              </span>
              <span className="mt-auto text-sm font-semibold text-muted-foreground">
                <Suspense fallback="… deals">
                  <CategoryCount slug={c.slug} />
                </Suspense>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function CategoryCount({ slug }: { slug: string }) {
  const { dict, fmt } = await getI18n();
  const stats = await getSiteStats();
  const n = stats.byCategory[slug] ?? 0;
  return (
    <>
      {n === 1
        ? dict.deals.countOne
        : t(dict.deals.countOther, { count: fmt.number(n) })}
    </>
  );
}
