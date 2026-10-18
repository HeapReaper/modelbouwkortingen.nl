"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useId, useTransition } from "react";
import {
  createPromotion,
  deletePromotion,
  type PromotionFormState,
  togglePromotion,
} from "@/app/[lang]/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminPromotion, PromotionStatus } from "@/lib/promotions";

const STATUS: Record<
  PromotionStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  active: { label: "loopt", variant: "default" },
  scheduled: { label: "gepland", variant: "secondary" },
  ended: { label: "afgelopen", variant: "outline" },
  off: { label: "uit", variant: "outline" },
};

/** "2026-10-19" → "19-10-2026". */
function day(iso: string) {
  return iso.split("-").reverse().join("-");
}

/** Uitgelichte webshops en producten (betaalde plaatsingen) aanmaken en beheren. */
export function PromotionsAdmin({
  promotions,
  shops,
  today,
}: {
  promotions: AdminPromotion[];
  shops: { slug: string; name: string }[];
  today: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Een uitgelichte webshop staat op de homepage en bovenaan /webshops; een
        uitgelicht product bovenaan de homepage, /aanbiedingen, zijn categorie
        en zijn webshop. Beide altijd met het label &quot;Gesponsord&quot;.
        Uitverkochte producten worden niet getoond. Kliks tellen vanaf de
        startdatum tot en met vandaag of de einddatum.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <PromotionForm kind="shop" shops={shops} today={today} />
        <PromotionForm kind="product" shops={shops} today={today} />
      </div>
      {promotions.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-muted-foreground">
          Nog geen promoties.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aan</TableHead>
                <TableHead>Uitgelicht</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Kliks</TableHead>
                <TableHead>Notitie</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((p) => (
                <PromotionRow key={p.id} promotion={p} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function PromotionForm({
  kind,
  shops,
  today,
}: {
  kind: "shop" | "product";
  shops: { slug: string; name: string }[];
  today: string;
}) {
  const [state, action, pending] = useActionState<PromotionFormState, FormData>(
    createPromotion,
    {},
  );
  const id = useId();
  return (
    <form
      key={state.ok}
      action={action}
      className="flex flex-col gap-2 rounded-xl border p-4"
    >
      <h3 className="font-bold">
        {kind === "shop" ? "Webshop uitlichten" : "Product uitlichten"}
      </h3>
      <input type="hidden" name="kind" value={kind} />
      {kind === "shop" ? (
        <NativeSelect name="shop" aria-label="Webshop" required>
          {shops.map((s) => (
            <NativeSelectOption key={s.slug} value={s.slug}>
              {s.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : (
        <Input
          name="product"
          required
          placeholder="Product-id of link (onze productpagina of de webshop)"
          aria-label="Product"
        />
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1 text-sm">
          <label htmlFor={`${id}-start`}>Van</label>
          <Input
            id={`${id}-start`}
            name="startsOn"
            type="date"
            defaultValue={today}
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-1 text-sm">
          <label htmlFor={`${id}-end`}>Tot en met (leeg = doorlopend)</label>
          <Input id={`${id}-end`} name="endsOn" type="date" />
        </div>
      </div>
      <Input
        name="note"
        maxLength={200}
        placeholder="Notitie, bv. adverteerder en prijs (niet zichtbaar op de site)"
        aria-label="Notitie"
      />
      <Button type="submit" disabled={pending} className="self-start">
        Toevoegen
      </Button>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}

function PromotionRow({ promotion: p }: { promotion: AdminPromotion }) {
  const [pending, start] = useTransition();
  const label = p.product ? p.product.name : p.shopName;
  return (
    <TableRow className={pending ? "opacity-60" : undefined}>
      <TableCell>
        <Switch
          checked={p.enabled}
          disabled={pending}
          aria-label={`${label} tonen`}
          onCheckedChange={(v) => start(() => togglePromotion(p.id, v))}
        />
      </TableCell>
      <TableCell className="max-w-80">
        {p.product ? (
          <>
            <a
              href={`/product/${p.product.id}`}
              className="line-clamp-1 font-semibold hover:underline"
            >
              {p.product.name}
            </a>
            <span className="text-sm text-muted-foreground">
              Product · {p.shopName}
            </span>
            {p.product.outOfStock ? (
              <Badge variant="destructive" className="ml-2">
                uitverkocht, niet zichtbaar
              </Badge>
            ) : null}
          </>
        ) : (
          <>
            <a
              href={`/webshops/${p.shopSlug}`}
              className="font-semibold hover:underline"
            >
              {p.shopName}
            </a>
            <span className="block text-sm text-muted-foreground">Webshop</span>
          </>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">
        {day(p.startsOn)} – {p.endsOn ? day(p.endsOn) : "…"}
      </TableCell>
      <TableCell>
        <Badge variant={STATUS[p.status].variant}>
          {STATUS[p.status].label}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-bold tabular-nums">
        {p.clicks.toLocaleString("nl-NL")}
      </TableCell>
      <TableCell className="max-w-60 text-sm text-muted-foreground">
        {p.note}
      </TableCell>
      <TableCell>
        <Button
          size="icon"
          variant="ghost"
          disabled={pending}
          aria-label={`${label} verwijderen`}
          onClick={() => {
            if (confirm(`Promotie voor ${label} verwijderen?`))
              start(() => deletePromotion(p.id));
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
