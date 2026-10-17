import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";

export async function Pager({
  page,
  totalPages,
  href,
}: {
  page: number;
  totalPages: number;
  href: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const { dict } = await getI18n();
  const pages = new Set(
    [1, totalPages, page - 1, page, page + 1].filter(
      (p) => p >= 1 && p <= totalPages,
    ),
  );
  const list = [...pages].sort((a, b) => a - b);
  const btn = cn(
    buttonVariants({ variant: "outline", size: "lg" }),
    "h-11 min-w-11 text-base",
  );
  return (
    <nav
      aria-label={dict.deals.pagination}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} className={btn} rel="prev">
          <ChevronLeft className="size-4" /> {dict.deals.previous}
        </Link>
      ) : null}
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - list[i - 1] > 1 ? (
            <span className="text-muted-foreground">…</span>
          ) : null}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              btn,
              p === page &&
                "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1)} className={btn} rel="next">
          {dict.deals.next} <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
