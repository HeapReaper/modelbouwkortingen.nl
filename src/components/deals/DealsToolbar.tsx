"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FilterForm } from "@/components/deals/FilterForm";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { type DealFilters, filtersToParams, SORT_OPTIONS } from "@/lib/filters";
import { withParams } from "@/lib/format";

export type FilterProps = {
  basePath: string;
  filters: DealFilters;
  hideCategory?: boolean;
  hideShop?: boolean;
};

/** Sorteren + (op mobiel) de filterknop met een uitschuifpaneel. */
export function DealsToolbar(props: FilterProps & { activeCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { basePath, filters, activeCount } = props;

  return (
    <div className="flex items-center gap-2">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="lg"
              className="h-11 text-base lg:hidden"
            />
          }
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 ? (
            <span className="ml-1 rounded-full bg-primary px-2 text-sm text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </SheetTrigger>
        <SheetContent side="left" className="w-[88%] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl">Filters</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-8">
            <FilterForm
              {...props}
              idPrefix="m"
              onApplied={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <label className="sr-only" htmlFor="sort">
        Sorteren
      </label>
      <NativeSelect
        id="sort"
        value={filters.sort ?? "korting"}
        onChange={(e) =>
          router.push(
            withParams(basePath, {
              ...filtersToParams(filters),
              sort: e.target.value,
            }),
          )
        }
        className="[&_select]:h-11 [&_select]:text-base"
      >
        {Object.entries(SORT_OPTIONS).map(([k, label]) => (
          <NativeSelectOption key={k} value={k}>
            {label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
