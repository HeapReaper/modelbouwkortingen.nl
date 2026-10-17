import { Tags } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/core/PageHeader";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import { getBrands } from "@/lib/deals";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, dict } = await getI18n();
  return {
    title: dict.brandsPage.title,
    description: dict.brandsPage.metaDescription,
    alternates: alternates(lang, "/merken"),
  };
}

export default async function BrandsPage() {
  const { dict } = await getI18n();
  return (
    <>
      <PageHeader
        title={dict.brandsPage.title}
        icon={<Tags className="size-8 text-primary" />}
        description={dict.brandsPage.description}
        crumbs={[{ href: "/merken", label: dict.brandsPage.title }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Suspense
          fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}
        >
          <BrandList />
        </Suspense>
      </div>
    </>
  );
}

async function BrandList() {
  const { dict, href } = await getI18n();
  const brands = await getBrands();
  if (brands.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-8 text-center text-lg text-muted-foreground">
        {dict.deals.noneYet}
      </p>
    );
  }
  const popular = brands.slice(0, 12);
  const byLetter = new Map<string, typeof brands>();
  for (const brand of [...brands].sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const first = brand.name[0]?.toUpperCase() ?? "#";
    const letter = /[A-Z]/.test(first) ? first : "#";
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), brand]);
  }
  const count = (n: number) =>
    n === 1 ? dict.deals.countOne : t(dict.deals.countOther, { count: n });

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-4 text-2xl font-black">{dict.brandsPage.popular}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {popular.map((b) => (
            <li key={b.slug}>
              <Link
                href={href(`/merk/${b.slug}`)}
                className="flex h-full flex-col gap-1 rounded-2xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-md"
              >
                <span className="text-lg font-bold">{b.name}</span>
                <span className="text-sm font-semibold text-primary">
                  {count(b.deals)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-black">{dict.brandsPage.all}</h2>
        <div className="flex flex-col gap-6">
          {[...byLetter].map(([letter, list]) => (
            <div key={letter} className="grid gap-2 sm:grid-cols-[3rem_1fr]">
              <h3 className="text-2xl font-black text-primary">{letter}</h3>
              <ul className="flex flex-wrap gap-2">
                {list.map((b) => (
                  <li key={b.slug}>
                    <Link
                      href={href(`/merk/${b.slug}`)}
                      className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm font-semibold hover:border-primary"
                    >
                      {b.name}
                      <span className="text-muted-foreground tabular-nums">
                        {b.deals}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
