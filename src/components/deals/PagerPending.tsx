"use client";

import { Loader2 } from "lucide-react";
import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

/**
 * Spinner over een pagineringsknop zolang de volgende pagina laadt. De resultaten hangen van
 * de URL af en zitten dus niet in de prefetch: zonder dit lijkt een klik bij een trage
 * zoekopdracht niets te doen. Altijd gerenderd en alleen zichtbaar gemaakt, zodat de knop
 * niet verspringt.
 */
export function PagerPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit] bg-background opacity-0 transition-opacity",
        pending && "opacity-100",
      )}
    >
      <Loader2 className="size-5 animate-spin text-primary motion-reduce:animate-none" />
    </span>
  );
}
