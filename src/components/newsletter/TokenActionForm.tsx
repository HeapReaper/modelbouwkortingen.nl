"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useActionState } from "react";
import type { NewsletterState } from "@/app/[lang]/nieuwsbrief/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

/**
 * Knop voor bevestigen/afmelden. Bewust een knop en geen actie bij het openen van de link:
 * virusscanners van mailproviders openen links automatisch.
 */
export function TokenActionForm({
  token,
  action,
  label,
  pendingLabel,
  variant,
}: {
  token: string;
  action: (
    prev: NewsletterState,
    formData: FormData,
  ) => Promise<NewsletterState>;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline";
}) {
  const { lang } = useI18n();
  const [state, formAction, pending] = useActionState(action, { ok: false });

  if (state.message) {
    return (
      <Alert variant={state.ok ? "default" : "destructive"} className="p-5">
        {state.ok ? <CheckCircle2 className="text-savings" /> : <XCircle />}
        <AlertDescription className="text-base">
          {state.message}
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="lang" value={lang} />
      <Button
        type="submit"
        size="lg"
        variant={variant}
        disabled={pending}
        className="h-12 px-8 text-base font-bold"
      >
        {pending ? pendingLabel : label}
      </Button>
    </form>
  );
}
