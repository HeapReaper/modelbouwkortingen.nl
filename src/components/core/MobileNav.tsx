"use client";

import { Flame, Mail, Menu, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/core/Logo";
import { SearchForm } from "@/components/core/SearchForm";
import { ThemeToggle } from "@/components/core/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useI18n } from "@/i18n/client";
import { CATEGORIES } from "@/lib/categories";

export function MobileNav() {
  const { dict, href } = useI18n();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="lg:hidden"
            aria-label={dict.nav.openMenu}
          />
        }
      >
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[88%] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-4 pb-8">
          <div onSubmitCapture={close}>
            <SearchForm />
          </div>
          <nav className="flex flex-col gap-1 text-lg font-semibold">
            <Link
              href={href("/aanbiedingen")}
              onClick={close}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
            >
              <Flame className="size-5 text-primary" /> {dict.nav.allDeals}
            </Link>
            <Link
              href={href("/webshops")}
              onClick={close}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
            >
              <Store className="size-5 text-primary" /> {dict.nav.shops}
            </Link>
            <Link
              href={href("/contact")}
              onClick={close}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
            >
              <Mail className="size-5 text-primary" /> {dict.nav.contact}
            </Link>
          </nav>
          <Separator />
          <div>
            <p className="mb-2 px-2 text-sm font-bold tracking-wide text-muted-foreground uppercase">
              {dict.nav.categories}
            </p>
            <nav className="grid grid-cols-1 gap-1">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={href(`/categorie/${c.slug}`)}
                  onClick={close}
                  className="flex items-center gap-3 rounded-lg p-2 text-base hover:bg-muted"
                >
                  <c.icon className="size-5 text-primary" />{" "}
                  {dict.categories[c.slug].name}
                </Link>
              ))}
            </nav>
          </div>
          <Separator className="sm:hidden" />
          <div className="flex items-center justify-between px-2 sm:hidden">
            <span className="text-base font-semibold">{dict.nav.theme}</span>
            <ThemeToggle />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
