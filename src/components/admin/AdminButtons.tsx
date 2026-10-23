"use client";

import { Play, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import {
  crawlShopNow,
  deleteMessage,
  resolveCrawlAlerts,
  toggleMessageHandled,
  toggleShopCategory,
  toggleShopEnabled,
} from "@/app/[lang]/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { formatNumber } from "@/lib/format";

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

export function DeleteMessageButton({
  id,
  subject,
}: {
  id: number;
  subject: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      disabled={pending}
      aria-label={`Bericht "${subject}" verwijderen`}
      onClick={() => {
        if (confirm(`Bericht "${subject}" verwijderen?`))
          start(() => deleteMessage(id));
      }}
    >
      <Trash2 className="size-4" />
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

type ShopCategoryRow = {
  slug: string;
  name: string;
  products: number;
  deals: number;
  hidden: boolean;
};

/** Per categorie kiezen of de producten van deze shop op de site staan. */
export function ShopCategoriesButton({
  slug,
  name,
  categories,
}: {
  slug: string;
  name: string;
  categories: ShopCategoryRow[];
}) {
  const hidden = categories.filter((c) => c.hidden).length;
  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        {hidden > 0 ? `${hidden} verborgen` : "Alle"}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Categorieën van {name}</DialogTitle>
          <DialogDescription>
            Verborgen categorieën worden wel gecrawld, maar staan niet op de
            website, in de kortingsmail of op Discord.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-y">
          {categories.map((c) => (
            <li
              key={c.slug}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className={c.products === 0 ? "text-muted-foreground" : ""}>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {formatNumber(c.products)} producten · {formatNumber(c.deals)}{" "}
                  deals
                </div>
              </div>
              <ShopCategorySwitch
                slug={slug}
                category={c.slug}
                name={c.name}
                visible={!c.hidden}
              />
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function ShopCategorySwitch({
  slug,
  category,
  name,
  visible,
}: {
  slug: string;
  category: string;
  name: string;
  visible: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <Switch
      checked={visible}
      disabled={pending}
      aria-label={`${name} tonen op de website`}
      onCheckedChange={(v) =>
        start(() => toggleShopCategory(slug, category, v))
      }
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
