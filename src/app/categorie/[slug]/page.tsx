import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/core/PageHeader";
import { DealGridSkeleton } from "@/components/deals/DealGrid";
import { DealsBrowser } from "@/components/deals/DealsBrowser";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/categorie/[slug]">): Promise<Metadata> {
  const category = getCategory((await params).slug);
  if (!category) return {};
  return {
    title: `${category.name} met korting`,
    description: `${category.name} in de aanbieding: ${category.description.toLowerCase()} met minstens €5 of 5% korting.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/categorie/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  return (
    <>
      <PageHeader
        title={`${category.name} in de aanbieding`}
        icon={<category.icon className="size-8 text-primary" />}
        description={`${category.description}. Alleen producten met minstens €5 of 5% korting.`}
        crumbs={[
          { href: "/aanbiedingen", label: "Aanbiedingen" },
          { href: `/categorie/${slug}`, label: category.name },
        ]}
      >
        <nav
          aria-label="Andere categorieën"
          className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1"
        >
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categorie/${c.slug}`}
              aria-current={c.slug === slug ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold",
                c.slug === slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:border-primary",
              )}
            >
              <c.icon className="size-4" /> {c.name}
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
