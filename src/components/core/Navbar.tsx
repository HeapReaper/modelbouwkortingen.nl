"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/core/Logo";
import { MobileNav } from "@/components/core/MobileNav";
import { SearchForm } from "@/components/core/SearchForm";
import { ThemeToggle } from "@/components/core/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { CATEGORIES } from "@/lib/categories";
import { SHOPS, shopInitials } from "@/lib/shops";
import { cn } from "@/lib/utils";

export default function Navbar() {
  return (
    <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-3 sm:px-4 lg:gap-6">
      <Link
        href="/"
        className="shrink-0"
        aria-label="Modelbouwkortingen.nl home"
      >
        <Logo />
      </Link>

      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={cn(navigationMenuTriggerStyle(), "text-base")}
              render={<Link href="/aanbiedingen">Aanbiedingen</Link>}
            />
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-base">
              Categorieën
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[36rem] grid-cols-2 gap-1 p-2">
                {CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <NavigationMenuLink
                      render={
                        <Link
                          href={`/categorie/${c.slug}`}
                          className="flex items-start gap-3"
                        >
                          <c.icon className="mt-0.5 size-5 text-primary" />
                          <span className="flex flex-col gap-0.5">
                            <span className="font-semibold">{c.name}</span>
                            <span className="line-clamp-1 text-muted-foreground">
                              {c.description}
                            </span>
                          </span>
                        </Link>
                      }
                    />
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-base">
              Webshops
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="flex w-96 flex-col gap-1 p-2">
                {SHOPS.map((s) => (
                  <li key={s.slug}>
                    <NavigationMenuLink
                      render={
                        <Link
                          href={`/webshops/${s.slug}`}
                          className="flex items-start gap-3"
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-black",
                              s.color,
                            )}
                          >
                            {shopInitials(s.name)}
                          </span>
                          <span className="flex flex-col gap-0.5">
                            <span className="font-semibold">{s.name}</span>
                            <span className="line-clamp-2 text-muted-foreground">
                              {s.description}
                            </span>
                          </span>
                        </Link>
                      }
                    />
                  </li>
                ))}
                <li>
                  <NavigationMenuLink
                    render={
                      <Link
                        href="/webshops"
                        className="font-semibold text-primary"
                      >
                        Alle webshops bekijken →
                      </Link>
                    }
                  />
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={cn(navigationMenuTriggerStyle(), "text-base")}
              render={<Link href="/contact">Contact</Link>}
            />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="ml-auto hidden w-full max-w-sm md:block">
        <SearchForm />
      </div>

      <div className="ml-auto flex shrink-0 items-center md:ml-0">
        <Link
          href="/zoeken"
          aria-label="Zoeken"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-lg" }),
            "md:hidden",
          )}
        >
          <Search className="size-5" />
        </Link>
        <ThemeToggle />
        <MobileNav />
      </div>
    </div>
  );
}
