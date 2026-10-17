import { SearchX } from "lucide-react";
import Link from "next/link";
import { DealGrid } from "@/components/deals/DealGrid";
import { DealsToolbar } from "@/components/deals/DealsToolbar";
import { FilterForm } from "@/components/deals/FilterForm";
import { Pager } from "@/components/deals/Pager";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getI18n } from "@/i18n/server";
import { getDeals } from "@/lib/deals";
import {
  type DealFilters,
  filtersToParams,
  PAGE_SIZE,
  parseFilters,
} from "@/lib/filters";
import { withParams } from "@/lib/format";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Lijst met deals + filters + paginering. Leest de query-string, dus altijd binnen
 * een <Suspense> gebruiken. `basePath` zonder taalprefix.
 */
export async function DealsBrowser({
  searchParams,
  basePath,
  fixed = {},
}: {
  searchParams: SearchParams;
  basePath: string;
  fixed?: Pick<DealFilters, "category" | "shop" | "brands">;
}) {
  const { dict, href, fmt } = await getI18n();
  const localBase = href(basePath);
  const filters = { ...parseFilters(await searchParams), ...fixed };
  const { deals, total } = await getDeals(filters);
  const page = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const urlFilters = {
    ...filters,
    category: fixed.category ? undefined : filters.category,
    shop: fixed.shop ? undefined : filters.shop,
  };
  const activeCount = [
    urlFilters.category,
    urlFilters.shop,
    filters.minDiscount,
    filters.minPrice,
    filters.maxPrice,
    filters.inStock,
  ].filter(Boolean).length;
  const filterProps = {
    basePath: localBase,
    filters: urlFilters,
    hideCategory: Boolean(fixed.category),
    hideShop: Boolean(fixed.shop),
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border bg-card p-5">
          <h2 className="mb-4 text-xl font-black">{dict.deals.filters}</h2>
          <FilterForm {...filterProps} idPrefix="d" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg" aria-live="polite">
            <strong className="font-black">{fmt.number(total)}</strong>{" "}
            {total === 1 ? dict.deals.foundOne : dict.deals.foundOther}
            {filters.q ? (
              <>
                {" "}
                {dict.deals.forQuery} <strong>“{filters.q}”</strong>
              </>
            ) : null}
          </p>
          <DealsToolbar {...filterProps} activeCount={activeCount} />
        </div>
        {deals.length === 0 ? (
          <Empty className="rounded-2xl border border-dashed py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle className="text-xl">
                {dict.deals.emptyTitle}
              </EmptyTitle>
              <EmptyDescription className="text-base">
                {dict.deals.emptyText}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link
                href={href("/aanbiedingen")}
                className={buttonVariants({ size: "lg" })}
              >
                {dict.deals.emptyCta}
              </Link>
            </EmptyContent>
          </Empty>
        ) : (
          <DealGrid deals={deals} />
        )}
        <Pager
          page={page}
          totalPages={totalPages}
          href={(p) =>
            withParams(localBase, {
              ...filtersToParams(urlFilters),
              pagina: p > 1 ? p : undefined,
            })
          }
        />
      </div>
    </div>
  );
}
