import { Search, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
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
import { withParams } from "@/lib/format";
import {
  findParts,
  PART_SORTS,
  type PartFilters,
  type PartSort,
} from "@/lib/partfinder";
import { getShop, SHOPS } from "@/lib/shops";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, dict } = await getI18n();
  return {
    title: dict.partfinderPage.metaTitle,
    description: t(dict.partfinderPage.metaDescription, {
      count: SHOPS.length,
    }),
    alternates: alternates(lang, "/partfinder"),
  };
}

type SearchParams = PageProps<"/[lang]/partfinder">["searchParams"];

async function readParams(searchParams: SearchParams): Promise<PartFilters> {
  const sp = await searchParams;
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const sort = one("sort") as PartSort | undefined;
  const page = Number(one("pagina"));
  return {
    q: one("q")?.slice(0, 100),
    category: getCategory(one("categorie"))?.slug,
    shop: getShop(one("winkel"))?.slug,
    inStock: one("voorraad") === "1",
    dealsOnly: one("deals") === "1",
    sort: sort && PART_SORTS.includes(sort) ? sort : "relevantie",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/** De filters als URL-parameters (zelfde namen als het formulier). */
function toParams(f: PartFilters) {
  return {
    q: f.q,
    categorie: f.category,
    winkel: f.shop,
    voorraad: f.inStock ? "1" : undefined,
    deals: f.dealsOnly ? "1" : undefined,
    sort: f.sort === "relevantie" ? undefined : f.sort,
  };
}

export default async function PartfinderPage({
  searchParams,
}: PageProps<"/[lang]/partfinder">) {
  const { dict } = await getI18n();
  const c = dict.partfinderPage;
  return (
    <>
      <PageHeader
        title={c.title}
        icon={<Wrench className="size-8 text-primary" />}
        description={c.description}
        crumbs={[{ href: "/partfinder", label: c.title }]}
      >
        <Suspense fallback={<div className="h-40" />}>
          <PartForm searchParams={searchParams} />
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
async function PartForm({ searchParams }: { searchParams: SearchParams }) {
  const { dict, href } = await getI18n();
  const c = dict.partfinderPage;
  const f = await readParams(searchParams);
  const select = "[&_select]:h-10 [&_select]:bg-background";
  return (
    <Form
      action={href("/partfinder")}
      className="flex max-w-3xl flex-col gap-3"
      key={JSON.stringify(toParams(f))}
    >
      <div className="flex gap-2">
        <InputGroup className="h-14 rounded-xl bg-background">
          <InputGroupAddon>
            <Search className="size-5" />
          </InputGroupAddon>
          <InputGroupInput
            name="q"
            type="search"
            defaultValue={f.q}
            placeholder={c.placeholder}
            aria-label={c.title}
            autoComplete="off"
            enterKeyHint="search"
            autoFocus={!f.q}
            className="text-lg"
          />
        </InputGroup>
        <CompareSubmit label={c.button} pendingLabel={c.searching} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          <label htmlFor="part-category" className="text-base font-semibold">
            {dict.filters.category}
          </label>
          <NativeSelect
            id="part-category"
            name="categorie"
            defaultValue={f.category ?? ""}
            className={select}
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
          <label htmlFor="part-shop" className="text-base font-semibold">
            {c.shop}
          </label>
          <NativeSelect
            id="part-shop"
            name="winkel"
            defaultValue={f.shop ?? ""}
            className={select}
          >
            <NativeSelectOption value="">{c.allShops}</NativeSelectOption>
            {SHOPS.map((s) => (
              <NativeSelectOption key={s.slug} value={s.slug}>
                {s.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="part-sort" className="text-base font-semibold">
            {c.sort}
          </label>
          <NativeSelect
            id="part-sort"
            name="sort"
            defaultValue={f.sort}
            className={select}
          >
            {PART_SORTS.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {c.sorts[s]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <label className="flex items-center gap-2 text-base font-semibold">
          <input
            type="checkbox"
            name="voorraad"
            value="1"
            defaultChecked={f.inStock}
            className="size-5 accent-primary"
          />
          {c.inStock}
        </label>
        <label className="flex items-center gap-2 text-base font-semibold">
          <input
            type="checkbox"
            name="deals"
            value="1"
            defaultChecked={f.dealsOnly}
            className="size-5 accent-primary"
          />
          {c.dealsOnly}
        </label>
      </div>
    </Form>
  );
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const { lang, dict, href } = await getI18n();
  const c = dict.partfinderPage;
  const f = await readParams(searchParams);
  if (!f.q) {
    return (
      <p className="rounded-2xl border border-dashed p-8 text-center text-lg text-muted-foreground">
        {t(c.intro, { count: SHOPS.length })}
      </p>
    );
  }
  const r = await findParts(f, lang);
  const query = `“${f.q}”`;
  const link = (params: Partial<Record<string, string | number>>) =>
    withParams(href("/partfinder"), { ...toParams(f), ...params });

  return (
    <>
      {r.shops.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted-foreground">
            {c.foundAt}
          </p>
          <ul className="flex flex-wrap gap-2">
            {r.shops.map((s) => {
              const active = s.slug === f.shop;
              return (
                <li key={s.slug}>
                  <Link
                    href={link({ winkel: active ? "" : s.slug })}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold hover:border-primary",
                      active &&
                        "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {s.name}
                    <span className="tabular-nums opacity-70">{s.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {r.total === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-lg text-muted-foreground">
          {t(c.none, { query })}
        </p>
      ) : (
        <>
          <p className="text-lg font-semibold" aria-live="polite">
            {r.total === 1
              ? t(c.resultsOne, { query })
              : t(c.resultsOther, { count: r.total, query })}
            {r.deals > 0 ? (
              <span className="text-savings">
                {" · "}
                {t(c.dealsCount, { count: r.deals })}
              </span>
            ) : null}
          </p>
          {r.truncated ? (
            <p className="text-muted-foreground">{c.truncated}</p>
          ) : null}
          {r.groups.map((g) => (
            <CompareCard key={g.key} group={g} />
          ))}
          <Pager
            page={Math.min(f.page ?? 1, r.totalPages)}
            totalPages={r.totalPages}
            href={(p) => link({ pagina: p > 1 ? p : "" })}
          />
          <p className="text-sm text-muted-foreground">
            {dict.comparePage.disclaimer}
          </p>
        </>
      )}
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
