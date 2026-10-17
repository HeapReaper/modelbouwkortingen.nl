"use client";

import { CheckCircle2, Webhook } from "lucide-react";
import { useActionState, useId } from "react";
import { subscribeDiscord } from "@/app/discord/actions";
import type { NewsletterState } from "@/app/nieuwsbrief/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function DiscordForm({ className }: { className?: string }) {
  const id = useId();
  const [state, action, pending] = useActionState<NewsletterState, FormData>(
    subscribeDiscord,
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
      <label htmlFor={`${id}-webhook`} className="text-base font-semibold">
        Webhook-URL
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={`${id}-webhook`}
          name="webhook"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          required
          placeholder="https://discord.com/api/webhooks/…"
          defaultValue={state.email}
          aria-invalid={Boolean(state.message)}
          aria-describedby={state.message ? `${id}-error` : undefined}
          className="h-12 bg-background font-mono text-sm"
        />
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-12 shrink-0 text-base font-bold sm:px-6"
        >
          <Webhook className="size-4" />
          {pending ? "Koppelen…" : "Koppelen"}
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
