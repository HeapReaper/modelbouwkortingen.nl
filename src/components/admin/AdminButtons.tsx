"use client";

import { useTransition } from "react";
import { toggleMessageHandled, toggleShopEnabled } from "@/app/admin/actions";
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
