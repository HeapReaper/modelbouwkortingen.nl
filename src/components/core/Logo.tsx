import { cn } from "@/lib/utils";

/** Prijskaartje met procentteken + woordmerk. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={cn("size-8 shrink-0 sm:size-9", className)}
    >
      <path
        d="M4 8a4 4 0 0 1 4-4h13.2a4 4 0 0 1 2.83 1.17l11.8 11.8a4 4 0 0 1 0 5.66L22.63 35.83a4 4 0 0 1-5.66 0L5.17 24.03A4 4 0 0 1 4 21.2Z"
        className="fill-primary"
      />
      <circle cx="11.5" cy="11.5" r="2.6" className="fill-background" />
      <path
        d="m15.5 27.5 11-11"
        className="stroke-deal"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="17.6" cy="18.6" r="2.4" className="fill-deal" />
      <circle cx="24.4" cy="25.4" r="2.4" className="fill-deal" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn("flex min-w-0 items-center gap-1.5 sm:gap-2", className)}
    >
      <LogoMark />
      <span className="font-heading text-[0.95rem] leading-none font-black tracking-tight min-[400px]:text-base sm:text-xl">
        Modelbouw<span className="text-primary">kortingen</span>
        <span className="hidden text-muted-foreground min-[380px]:inline">
          .nl
        </span>
      </span>
    </span>
  );
}
