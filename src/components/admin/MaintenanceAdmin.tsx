"use client";

import { useActionState, useState } from "react";
import {
  type MaintenanceFormState,
  saveMaintenance,
} from "@/app/[lang]/admin/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/** Onderhoudsmodus: bezoekers zien een 503-pagina, jij (ingelogd op /admin) de gewone site. */
export function MaintenanceAdmin({
  enabled,
  message,
}: {
  enabled: boolean;
  message: string;
}) {
  const [state, action, pending] = useActionState<
    MaintenanceFormState,
    FormData
  >(saveMaintenance, {});
  const [on, setOn] = useState(enabled);
  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Staat dit aan, dan krijgen bezoekers een onderhoudspagina (HTTP 503).
        Het admin panel, de API-routes en deze browser blijven gewoon werken. De
        wijziging is binnen ongeveer 10 seconden overal zichtbaar.
      </p>
      <div className="flex items-center gap-3 font-semibold">
        <Switch
          checked={on}
          onCheckedChange={setOn}
          aria-labelledby="maintenance-label"
        />
        <span id="maintenance-label">Onderhoudsmodus {on ? "aan" : "uit"}</span>
      </div>
      {on ? <input type="hidden" name="enabled" value="on" /> : null}
      <Textarea
        name="message"
        defaultValue={message}
        maxLength={500}
        rows={3}
        placeholder="Extra tekst op de onderhoudspagina (optioneel), bv. ‘Rond 14:00 zijn we terug.’"
        aria-label="Extra tekst op de onderhoudspagina"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          Opslaan
        </Button>
        {state.ok && !pending ? (
          <span className="text-sm text-muted-foreground">Opgeslagen.</span>
        ) : null}
      </div>
    </form>
  );
}
