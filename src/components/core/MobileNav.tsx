"use client";

import { Flame, Mail, Menu, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/core/Logo";
import { SearchForm } from "@/components/core/SearchForm";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CATEGORIES } from "@/lib/categories";

export function MobileNav() {
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
            aria-label="Menu openen"
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
              href="/aanbiedingen"
              onClick={close}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
            >
              <Flame className="size-5 text-primary" /> Alle aanbiedingen
            </Link>
            <Link
              href="/webshops"
              onClick={close}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
            >
              <Store className="size-5 text-primary" /> Webshops
            </Link>
            <Link
              href="/contact"
              onClick={close}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
            >
              <Mail className="size-5 text-primary" /> Contact
            </Link>
          </nav>
          <Separator />
          <div>
            <p className="mb-2 px-2 text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Categorieën
            </p>
            <nav className="grid grid-cols-1 gap-1">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/categorie/${c.slug}`}
                  onClick={close}
                  className="flex items-center gap-3 rounded-lg p-2 text-base hover:bg-muted"
                >
                  <c.icon className="size-5 text-primary" /> {c.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
