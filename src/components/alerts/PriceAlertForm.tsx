"use client";

import { BellRing, CheckCircle2 } from "lucide-react";
import { useActionState, useId } from "react";
import type { NewsletterState } from "@/app/[lang]/nieuwsbrief/shared";
import { createPriceAlert } from "@/app/[lang]/prijsalarm/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { t } from "@/i18n/translate";
import { cn } from "@/lib/utils";

/** "Mail mij als de prijs onder € … komt" op de productpagina. */
export function PriceAlertForm({
  productId,
  price,
  className,
}: {
  productId: number;
  price: number;
  className?: string;
}) {
  const id = useId();
  const { lang, dict, fmt } = useI18n();
  const a = dict.priceAlert;
  const [state, action, pending] = useActionState<NewsletterState, FormData>(
    createPriceAlert,
    { ok: false },
  );
  // Voorstel: 10% onder de huidige prijs, afgerond op hele euro's.
  const suggestion = Math.max(1, Math.floor(price * 0.9));

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-5",
        className,
      )}
      aria-labelledby={`${id}-title`}
    >
      <h2
        id={`${id}-title`}
        className="flex items-center gap-2 text-xl font-black"
      >
        <BellRing className="size-5 text-primary" />
        {a.title}
      </h2>
      {state.ok ? (
        <output className="flex items-start gap-2 text-base font-semibold">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-savings" />
          {state.message}
        </output>
      ) : (
        <form action={action} className="flex flex-col gap-3" noValidate>
          <p className="text-muted-foreground">
            {t(a.text, { price: fmt.euro(price) })}
          </p>
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="product" value={productId} />
          <div className="grid gap-2 sm:grid-cols-[9rem_1fr]">
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-target`} className="text-sm font-semibold">
                {a.targetLabel}
              </label>
              <Input
                id={`${id}-target`}
                name="target"
                inputMode="decimal"
                required
                defaultValue={suggestion}
                className="h-11 bg-background text-base tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-email`} className="text-sm font-semibold">
                {a.emailLabel}
              </label>
              <Input
                id={`${id}-email`}
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={dict.newsletter.emailPlaceholder}
                defaultValue={state.email}
                aria-invalid={Boolean(state.message)}
                aria-describedby={state.message ? `${id}-error` : undefined}
                className="h-11 bg-background text-base"
              />
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="h-11 text-base font-bold"
          >
            <BellRing className="size-4" />
            {pending ? a.submitting : a.submit}
          </Button>
          {state.message ? (
            <p
              id={`${id}-error`}
              className="text-sm font-semibold text-destructive"
            >
              {state.message}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">{a.privacy}</p>
          {/* Honeypot tegen spam, onzichtbaar voor mensen */}
          <div
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 overflow-hidden"
          >
            <label>
              Website
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>
        </form>
      )}
    </section>
  );
}
