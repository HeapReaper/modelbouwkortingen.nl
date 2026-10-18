"use client";

import { useTransition } from "react";
import {
  resolveCrawlAlerts,
  toggleMessageHandled,
  toggleShopEnabled,
} from "@/app/[lang]/admin/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function MessageHandledButton({
  id,
  handled,
}: {
  id: number;
  handled: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant={handled ? "outline" : "default"}
      disabled={pending}
      onClick={() => start(() => toggleMessageHandled(id, !handled))}
    >
      {handled ? "Markeer als open" : "Markeer als afgehandeld"}
    </Button>
  );
}

/** Eén crawlermelding afhandelen, of zonder runId alle open meldingen. */
export function ResolveAlertButton({ runId }: { runId?: number }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => start(() => resolveCrawlAlerts(runId))}
    >
      {runId === undefined ? "Alles afhandelen" : "Afgehandeld"}
    </Button>
  );
}

export function ShopEnabledSwitch({
  slug,
  enabled,
}: {
  slug: string;
  enabled: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <Switch
      checked={enabled}
      disabled={pending}
      aria-label="Shop tonen op de website"
      onCheckedChange={(v) => start(() => toggleShopEnabled(slug, v))}
    />
  );
}
