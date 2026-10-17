import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";

/** Paginakop; crumbs krijgen hun href zonder taalprefix (die voegt PageHeader toe). */
export async function PageHeader({
  title,
  description,
  crumbs = [],
  icon,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  crumbs?: { href: string; label: string }[];
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const { dict, href } = await getI18n();
  return (
    <div className={cn("border-b bg-accent", className)}>
      <div className="bg-sale-stripes">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 sm:py-10">
          {crumbs.length > 0 ? (
            <nav
              aria-label={dict.breadcrumb.label}
              className="flex flex-wrap items-center gap-1 text-sm font-semibold text-muted-foreground"
            >
              <Link
                href={href("/")}
                className="hover:text-foreground hover:underline"
              >
                {dict.breadcrumb.home}
              </Link>
              {crumbs.map((c) => (
                <span key={c.href} className="flex items-center gap-1">
                  <ChevronRight className="size-4" />
                  <Link
                    href={href(c.href)}
                    className="hover:text-foreground hover:underline"
                  >
                    {c.label}
                  </Link>
                </span>
              ))}
            </nav>
          ) : null}
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight sm:text-4xl">
            {icon}
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-lg text-foreground/80">
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
