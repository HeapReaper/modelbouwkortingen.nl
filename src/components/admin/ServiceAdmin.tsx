"use client";

import { RefreshCw, Send } from "lucide-react";
import { useActionState, useTransition } from "react";
import {
  recheckServices,
  sendTestMail,
  type TestMailState,
} from "@/app/[lang]/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Gooit de bewaarde uitkomst weg en controleert alle diensten opnieuw. */
export function RecheckButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => start(() => recheckServices())}
    >
      <RefreshCw className={pending ? "animate-spin" : ""} /> Opnieuw
      controleren
    </Button>
  );
}

/** Stuurt een testmail via de SMTP-instellingen van de site. */
export function TestMailForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<TestMailState, FormData>(
    sendTestMail,
    {},
  );
  return (
    <div className="flex flex-col gap-2">
      <p className="font-semibold">Testmail versturen</p>
      <form action={action} className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="email"
          type="email"
          required
          placeholder="jij@voorbeeld.nl"
          aria-label="E-mailadres"
          className="sm:max-w-72"
          disabled={disabled}
        />
        <Button type="submit" disabled={disabled || pending}>
          <Send /> {pending ? "Bezig…" : "Versturen"}
        </Button>
      </form>
      {disabled ? (
        <p className="text-sm text-muted-foreground">
          Stel eerst <code>SMTP_HOST</code> en <code>MAIL_FROM</code> in.
        </p>
      ) : state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : state.sentTo ? (
        <p className="text-sm text-savings">
          Verstuurd naar {state.sentTo}. Kijk ook in de spammap.
        </p>
      ) : null}
    </div>
  );
}
