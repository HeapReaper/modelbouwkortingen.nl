"use client";

import { CheckCircle2, Mail } from "lucide-react";
import { useActionState, useId } from "react";
import { subscribeNewsletter } from "@/app/[lang]/nieuwsbrief/actions";
import type { NewsletterState } from "@/app/[lang]/nieuwsbrief/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

export function NewsletterForm({ className }: { className?: string }) {
  const id = useId();
  const { lang, dict } = useI18n();
  const n = dict.newsletter;
  const [state, action, pending] = useActionState<NewsletterState, FormData>(
    subscribeNewsletter,
    { ok: false },
  );

  if (state.ok) {
    return (
      <output
        className={cn(
          "flex items-start gap-2 text-base font-semibold",
          className,
        )}
      >
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-savings" />
        {state.message}
      </output>
    );
  }

  return (
    <form
      action={action}
      className={cn("flex flex-col gap-2", className)}
      noValidate
    >
      <input type="hidden" name="lang" value={lang} />
      <label htmlFor={`${id}-email`} className="sr-only">
        {n.emailLabel}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={n.emailPlaceholder}
          defaultValue={state.email}
          aria-invalid={Boolean(state.message)}
          aria-describedby={state.message ? `${id}-error` : undefined}
          className="h-12 bg-background text-base"
        />
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-12 shrink-0 text-base font-bold sm:px-6"
        >
          <Mail className="size-4" />
          {pending ? n.submitting : n.submit}
        </Button>
      </div>
      {state.message ? (
        <p
          id={`${id}-error`}
          className="text-sm font-semibold text-destructive"
        >
          {state.message}
        </p>
      ) : null}
      {/* Honeypot tegen spam, onzichtbaar voor mensen */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 overflow-hidden"
      >
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
    </form>
  );
}
