import { Scale, Search } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import { Suspense } from "react";
import { CompareCard } from "@/components/compare/CompareResults";
import { CompareSubmit } from "@/components/compare/CompareSubmit";
import { PageHeader } from "@/components/core/PageHeader";
import { Pager } from "@/components/deals/Pager";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { type CompareSort, comparePrices } from "@/lib/compare";
import { withParams } from "@/lib/format";
import { SHOPS } from "@/lib/shops";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, dict } = await getI18n();
  return {
    title: dict.comparePage.metaTitle,
    description: dict.comparePage.metaDescription,
    alternates: alternates(lang, "/prijsvergelijker"),
  };
}

type SearchParams = PageProps<"/[lang]/prijsvergelijker">["searchParams"];

async function readParams(searchParams: SearchParams) {
  const sp = await searchParams;
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const page = Number(one("pagina"));
  return {
    q: one("q")?.slice(0, 100),
    inStock: one("voorraad") === "1",
    category: getCategory(one("categorie"))?.slug,
    sort: (one("sort") === "aanbod" ? "aanbod" : "prijs") as CompareSort,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

type CompareParams = Awaited<ReturnType<typeof readParams>>;

/** De filters als URL-parameters (zelfde namen als het formulier), zonder pagina. */
function toParams(p: CompareParams) {
  return {
    q: p.q,
    voorraad: p.inStock ? "1" : undefined,
    categorie: p.category,
    sort: p.sort === "prijs" ? undefined : p.sort,
  };
}

export default async function PrijsvergelijkerPage({
  searchParams,
}: PageProps<"/[lang]/prijsvergelijker">) {
  const { dict } = await getI18n();
  const c = dict.comparePage;
  return (
    <>
      <PageHeader
        title={c.title}
        icon={<Scale className="size-8 text-primary" />}
        description={c.description}
        crumbs={[{ href: "/prijsvergelijker", label: c.title }]}
      >
        <Suspense fallback={<div className="h-28" />}>
          <CompareForm searchParams={searchParams} />
        </Suspense>
      </PageHeader>
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
        <Suspense fallback={<ResultsSkeleton />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

/** GET-formulier: werkt zonder JavaScript en houdt de zoekopdracht in de URL (deelbaar). */
async function CompareForm({ searchParams }: { searchParams: SearchParams }) {
  const { dict, href } = await getI18n();
  const c = dict.comparePage;
  const { q, inStock, category, sort } = await readParams(searchParams);
  return (
    <Form
      action={href("/prijsvergelijker")}
      className="flex max-w-3xl flex-col gap-3"
      key={`${q}-${inStock}-${category}-${sort}`}
    >
      <div className="flex gap-2">
        <InputGroup className="h-14 rounded-xl bg-background">
          <InputGroupAddon>
            <Search className="size-5" />
          </InputGroupAddon>
          <InputGroupInput
            name="q"
            type="search"
            defaultValue={q}
            placeholder={c.placeholder}
            aria-label={c.title}
            autoComplete="off"
            enterKeyHint="search"
            autoFocus={!q}
            className="text-lg"
          />
        </InputGroup>
        <CompareSubmit label={c.button} pendingLabel={c.comparing} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-base font-semibold">
          <input
            type="checkbox"
            name="voorraad"
            value="1"
            defaultChecked={inStock}
            className="size-5 accent-primary"
          />
          {c.inStock}
        </label>
        <div className="flex items-center gap-2">
          <label htmlFor="compare-category" className="text-base font-semibold">
            {dict.filters.category}
          </label>
          <NativeSelect
            id="compare-category"
            name="categorie"
            defaultValue={category ?? ""}
            className="[&_select]:h-10 [&_select]:bg-background"
          >
            <NativeSelectOption value="">
              {dict.filters.allCategories}
            </NativeSelectOption>
            {CATEGORIES.map((cat) => (
              <NativeSelectOption key={cat.slug} value={cat.slug}>
                {dict.categories[cat.slug].name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="compare-sort" className="text-base font-semibold">
            {c.sort}
          </label>
          <NativeSelect
            id="compare-sort"
            name="sort"
            defaultValue={sort}
            className="[&_select]:h-10 [&_select]:bg-background"
          >
            <NativeSelectOption value="prijs">{c.sortPrice}</NativeSelectOption>
            <NativeSelectOption value="aanbod">
              {c.sortOffers}
            </NativeSelectOption>
          </NativeSelect>
        </div>
      </div>
    </Form>
  );
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const { lang, dict, href } = await getI18n();
  const c = dict.comparePage;
  const params = await readParams(searchParams);
  const { q, inStock, category, sort } = params;
  if (!q) {
    return (
      <p className="rounded-2xl border border-dashed p-8 text-center text-lg text-muted-foreground">
        {t(c.intro, { count: SHOPS.length })}
      </p>
    );
  }
  const { groups, total, totalPages, page, truncated, tooShort } =
    await comparePrices(q, {
      inStock,
      category,
      sort,
      lang,
      page: params.page,
    });
  if (tooShort) {
    return (
      <p className="rounded-2xl border border-dashed p-8 text-center text-lg text-muted-foreground">
        {c.tooShort}
      </p>
    );
  }
  const query = `“${q}”`;
  if (total === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-8 text-center text-lg text-muted-foreground">
        {t(c.none, { query })}
      </p>
    );
  }
  return (
    <>
      <p className="text-lg font-semibold" aria-live="polite">
        {total === 1
          ? t(c.resultsOne, { query })
          : t(c.resultsOther, { count: total, query })}
      </p>
      {groups.map((g) => (
        <CompareCard key={g.key} group={g} />
      ))}
      <Pager
        page={page}
        totalPages={totalPages}
        href={(p) =>
          withParams(href("/prijsvergelijker"), {
            ...toParams(params),
            pagina: p > 1 ? p : undefined,
          })
        }
      />
      {truncated ? (
        <p className="text-muted-foreground">{c.truncated}</p>
      ) : null}
      <p className="text-sm text-muted-foreground">{c.disclaimer}</p>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <>
      <div className="h-7 w-64 animate-pulse rounded bg-muted" />
      {["a", "b", "c"].map((k) => (
        <div
          key={k}
          className="grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-[9rem_1fr] sm:p-5"
        >
          <div className="aspect-square w-28 animate-pulse rounded-xl bg-muted sm:w-full" />
          <div className="flex flex-col gap-3">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
            <div className="h-28 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}
