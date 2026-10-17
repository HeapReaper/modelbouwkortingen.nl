"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/** Zoekknop van de prijsvergelijker met een spinner zolang de nieuwe resultaten laden. */
export function CompareSubmit({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      aria-busy={pending}
      className="h-14 px-6 text-base font-bold"
    >
      {pending ? (
        <Loader2
          aria-hidden="true"
          className="size-5 animate-spin motion-reduce:animate-none"
        />
      ) : null}
      {pending ? pendingLabel : label}
    </Button>
  );
}
