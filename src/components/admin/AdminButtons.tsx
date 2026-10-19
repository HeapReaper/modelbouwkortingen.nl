"use client";

import { Play } from "lucide-react";
import { useState, useTransition } from "react";
import {
  crawlShopNow,
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

/** Start meteen een crawl-ronde voor deze shop (uitgeschakeld zolang er een loopt). */
export function CrawlNowButton({
  shop,
  running,
}: {
  shop: string;
  running: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-3 flex flex-col gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={pending || running}
        onClick={() =>
          start(async () => {
            setError(await crawlShopNow(shop));
          })
        }
      >
        <Play /> {running ? "Ronde loopt" : "Nu crawlen"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
