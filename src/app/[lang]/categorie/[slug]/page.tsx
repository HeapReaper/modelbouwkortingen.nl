import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/core/PageHeader";
import { DealGridSkeleton } from "@/components/deals/DealGrid";
import { DealsBrowser } from "@/components/deals/DealsBrowser";
import { alternates, feedLink } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/categorie/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!getCategory(slug)) return {};
  const { lang, dict } = await getI18n();
  const { name, description } = dict.categories[slug];
  return {
    title: t(dict.categoryPage.metaTitle, { name }),
    description: t(dict.categoryPage.metaDescription, {
      name,
      description: description.toLowerCase(),
    }),
    alternates: {
      ...alternates(lang, `/categorie/${slug}`),
      types: feedLink(lang, t(dict.feed.titleFiltered, { subject: name }), {
        categorie: slug,
      }),
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/[lang]/categorie/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const { dict, href } = await getI18n();
  const { name, description } = dict.categories[slug];

  return (
    <>
      <PageHeader
        title={t(dict.categoryPage.title, { name })}
        icon={<category.icon className="size-8 text-primary" />}
        description={t(dict.categoryPage.description, { description })}
        crumbs={[
          { href: "/aanbiedingen", label: dict.dealsPage.crumb },
          { href: `/categorie/${slug}`, label: name },
        ]}
      >
        <nav
          aria-label={dict.categoryPage.others}
          className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1"
        >
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={href(`/categorie/${c.slug}`)}
              aria-current={c.slug === slug ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold",
                c.slug === slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:border-primary",
              )}
            >
              <c.icon className="size-4" /> {dict.categories[c.slug].name}
            </Link>
          ))}
        </nav>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<DealGridSkeleton />}>
          <DealsBrowser
            searchParams={searchParams}
            basePath={`/categorie/${slug}`}
            fixed={{ category: slug }}
          />
        </Suspense>
      </div>
    </>
  );
}
