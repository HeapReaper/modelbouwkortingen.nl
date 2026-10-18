"use client";

import { cn } from "@/lib/utils";

type GoogleFc = {
  callbackQueue?: (() => void)[];
  showRevocationMessage?: () => void;
};

/**
 * Opent de cookiemelding van Google (Privacy en berichten in AdSense) opnieuw, zodat de
 * bezoeker zijn toestemming voor advertentiecookies kan wijzigen. Werkt zodra het AdSense-
 * script geladen is; de callbackQueue wacht daar zelf op.
 */
export function CookieSettingsButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer hover:text-foreground hover:underline",
        className,
      )}
      onClick={() => {
        const w = window as unknown as { googlefc?: GoogleFc };
        w.googlefc ??= {};
        w.googlefc.callbackQueue ??= [];
        w.googlefc.callbackQueue.push(() =>
          w.googlefc?.showRevocationMessage?.(),
        );
      }}
    >
      {label}
    </button>
  );
}
