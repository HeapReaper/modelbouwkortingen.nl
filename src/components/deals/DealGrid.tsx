import { DealCard } from "@/components/deals/DealCard";
import type { Deal } from "@/lib/deals";

export function DealGrid({ deals }: { deals: Deal[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {deals.map((d, i) => (
        <li key={d.id}>
          <DealCard deal={d} eager={i < 4} />
        </li>
      ))}
    </ul>
  );
}

export function DealGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => `skeleton-${i}`).map((key) => (
        <li
          key={key}
          className="flex flex-col overflow-hidden rounded-2xl border bg-card"
        >
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="flex flex-col gap-3 p-4">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-5 w-full animate-pulse rounded bg-muted" />
            <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}
