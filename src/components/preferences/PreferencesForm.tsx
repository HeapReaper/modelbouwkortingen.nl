"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useActionState } from "react";
import type { NewsletterState } from "@/app/[lang]/nieuwsbrief/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { useI18n } from "@/i18n/client";
import { t } from "@/i18n/translate";
import { CATEGORIES } from "@/lib/categories";
import { type DealPreferences, MIN_DISCOUNT_STEPS } from "@/lib/preferences";
import { HOME_COUNTRIES, SHOPS } from "@/lib/shops";

/**
 * Categorieën, webshops en minimale korting voor de kortingsmail of Discord. Niets aangevinkt
 * in een groep = alles uit die groep.
 */
export function PreferencesForm({
  token,
  initial,
  action,
}: {
  token: string;
  initial: DealPreferences;
  action: (
    prev: NewsletterState,
    formData: FormData,
  ) => Promise<NewsletterState>;
}) {
  const { lang, dict } = useI18n();
  const p = dict.preferences;
  const [state, formAction, pending] = useActionState(action, { ok: false });
  const all = (list: string[]) => list.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="lang" value={lang} />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-xl font-black">{p.categories}</legend>
        <p className="text-muted-foreground">{p.categoriesHint}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <label
              key={c.slug}
              className="flex items-center gap-3 rounded-lg border bg-card p-3 text-base font-semibold"
            >
              <input
                type="checkbox"
                name="categorie"
                value={c.slug}
                defaultChecked={
                  all(initial.categories) || initial.categories.includes(c.slug)
                }
                className="size-5 accent-primary"
              />
              <c.icon className="size-5 text-primary" />
              {dict.categories[c.slug].name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-xl font-black">{p.shops}</legend>
        <p className="text-muted-foreground">
          {t(p.shopsHint, { countries: HOME_COUNTRIES.join("/") })}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SHOPS.map((s) => (
            <label
              key={s.slug}
              className="flex items-center gap-3 rounded-lg border bg-card p-3 text-base font-semibold"
            >
              <input
                type="checkbox"
                name="shop"
                value={s.slug}
                defaultChecked={
                  all(initial.shops) || initial.shops.includes(s.slug)
                }
                className="size-5 accent-primary"
              />
              <span className="min-w-0 flex-1">{s.name}</span>
              {s.country ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground">
                  {s.country}
                </span>
              ) : null}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="pref-korting" className="text-xl font-black">
          {p.minDiscount}
        </label>
        <NativeSelect
          id="pref-korting"
          name="korting"
          defaultValue={String(initial.minDiscount)}
          className="w-full max-w-xs [&_select]:h-11 [&_select]:text-base"
        >
          {MIN_DISCOUNT_STEPS.map((n) => (
            <NativeSelectOption key={n} value={String(n)}>
              {n === 0 ? dict.filters.all : `${n}%+`}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="flex flex-col gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-12 w-fit px-8 text-base font-bold"
        >
          {pending ? p.saving : p.save}
        </Button>
        {state.message ? (
          <Alert variant={state.ok ? "default" : "destructive"} className="p-5">
            {state.ok ? <CheckCircle2 className="text-savings" /> : <XCircle />}
            <AlertDescription className="text-base">
              {state.message}
            </AlertDescription>
          </Alert>
        ) : null}
      </div>
    </form>
  );
}
