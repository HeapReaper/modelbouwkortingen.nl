"use client";

import Form from "next/form";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { useI18n } from "@/i18n/client";
import { CATEGORIES } from "@/lib/categories";
import type { DealFilters } from "@/lib/filters";
import { SHOPS } from "@/lib/shops";
import { cn } from "@/lib/utils";

const DISCOUNT_STEPS = [0, 10, 20, 30, 50];

/**
 * Filterformulier als gewone GET-form: werkt zonder JavaScript, en met JavaScript
 * wordt het direct toegepast zodra je iets aanpast.
 */
export function FilterForm({
  basePath,
  filters,
  hideCategory,
  hideShop,
  idPrefix,
  onApplied,
}: {
  basePath: string;
  filters: DealFilters;
  hideCategory?: boolean;
  hideShop?: boolean;
  idPrefix: string;
  onApplied?: () => void;
}) {
  const { dict } = useI18n();
  const f = dict.filters;
  const ref = useRef<HTMLFormElement>(null);
  const submit = () => ref.current?.requestSubmit();
  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <Form
      ref={ref}
      action={basePath}
      onSubmit={() => onApplied?.()}
      className="flex flex-col gap-6"
      key={JSON.stringify(filters)}
    >
      {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
      {filters.sort ? (
        <input type="hidden" name="sort" value={filters.sort} />
      ) : null}

      {!hideCategory && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("cat")} className="text-base font-bold">
            {f.category}
          </Label>
          <NativeSelect
            id={id("cat")}
            name="categorie"
            defaultValue={filters.category ?? ""}
            onChange={submit}
            className="w-full [&_select]:h-11 [&_select]:text-base"
          >
            <NativeSelectOption value="">{f.allCategories}</NativeSelectOption>
            {CATEGORIES.map((c) => (
              <NativeSelectOption key={c.slug} value={c.slug}>
                {dict.categories[c.slug].name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      )}

      {!hideShop && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={id("shop")} className="text-base font-bold">
            {f.shop}
          </Label>
          <NativeSelect
            id={id("shop")}
            name="shop"
            defaultValue={filters.shop ?? ""}
            onChange={submit}
            className="w-full [&_select]:h-11 [&_select]:text-base"
          >
            <NativeSelectOption value="">{f.allShops}</NativeSelectOption>
            {SHOPS.map((s) => (
              <NativeSelectOption key={s.slug} value={s.slug}>
                {s.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-bold">{f.minDiscount}</legend>
        <div className="flex flex-wrap gap-2">
          {DISCOUNT_STEPS.map((step) => {
            const checked = (filters.minDiscount ?? 0) === step;
            return (
              <label
                key={step}
                className={cn(
                  "cursor-pointer rounded-full border px-3.5 py-1.5 text-base font-semibold transition has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:border-primary/50",
                )}
              >
                <input
                  type="radio"
                  name="korting"
                  value={step || ""}
                  defaultChecked={checked}
                  onChange={submit}
                  className="sr-only"
                />
                {step === 0 ? f.all : `${step}%+`}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-bold">{f.price}</legend>
        <div className="flex items-center gap-2">
          <Input
            name="min"
            type="number"
            inputMode="decimal"
            min={0}
            placeholder={f.min}
            aria-label={f.minLabel}
            defaultValue={filters.minPrice ?? ""}
            className="h-11 text-base"
          />
          <span className="text-muted-foreground">{f.to}</span>
          <Input
            name="max"
            type="number"
            inputMode="decimal"
            min={0}
            placeholder={f.max}
            aria-label={f.maxLabel}
            defaultValue={filters.maxPrice ?? ""}
            className="h-11 text-base"
          />
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <Checkbox
          id={id("stock")}
          name="voorraad"
          value="1"
          defaultChecked={filters.inStock}
          onCheckedChange={() => setTimeout(submit, 0)}
          className="size-5"
        />
        <Label htmlFor={id("stock")} className="text-base">
          {f.inStock}
        </Label>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="submit" size="lg" className="h-11 text-base font-bold">
          {f.apply}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="h-11 text-base"
          onClick={() => {
            window.location.href =
              basePath +
              (filters.q ? `?q=${encodeURIComponent(filters.q)}` : "");
          }}
        >
          {f.clear}
        </Button>
      </div>
    </Form>
  );
}
