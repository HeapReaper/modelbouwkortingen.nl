"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

/** Ververst het admin panel elke 15 seconden (aan/uit te zetten). */
export function AutoRefresh() {
  const router = useRouter();
  const [on, setOn] = useState(true);
  const [pending, start] = useTransition();
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => start(() => router.refresh()), 15_000);
    return () => clearInterval(t);
  }, [on, router]);
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Switch id="auto-refresh" checked={on} onCheckedChange={setOn} />
        <label htmlFor="auto-refresh">Auto-refresh</label>
      </div>
      <Button
        variant="outline"
        size="lg"
        onClick={() => start(() => router.refresh())}
        disabled={pending}
      >
        <RefreshCw className={pending ? "animate-spin" : ""} /> Vernieuwen
      </Button>
    </div>
  );
}
