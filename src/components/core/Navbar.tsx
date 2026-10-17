"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/core/LanguageSwitcher";
import { Logo } from "@/components/core/Logo";
import { MobileNav } from "@/components/core/MobileNav";
import { SearchForm } from "@/components/core/SearchForm";
import { ShopLogo } from "@/components/core/ShopLogo";
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
import { useI18n } from "@/i18n/client";
import { CATEGORIES } from "@/lib/categories";
import { SHOPS } from "@/lib/shops";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { dict, href } = useI18n();
  return (
    <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-3 sm:px-4 lg:gap-6">
      <Link
        href={href("/")}
        className="shrink-0"
        aria-label={dict.nav.homeLabel}
      >
        <Logo />
      </Link>

      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={cn(navigationMenuTriggerStyle(), "text-base")}
              render={
                <Link href={href("/aanbiedingen")}>{dict.nav.deals}</Link>
              }
            />
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={cn(navigationMenuTriggerStyle(), "text-base")}
              render={
                <Link href={href("/prijsvergelijker")}>{dict.nav.compare}</Link>
              }
            />
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-base">
              {dict.nav.categories}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[36rem] grid-cols-2 gap-1 p-2">
                {CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <NavigationMenuLink
                      render={
                        <Link
                          href={href(`/categorie/${c.slug}`)}
                          className="flex items-start gap-3"
                        >
                          <c.icon className="mt-0.5 size-5 text-primary" />
                          <span className="flex flex-col gap-0.5">
                            <span className="font-semibold">
                              {dict.categories[c.slug].name}
                            </span>
                            <span className="line-clamp-1 text-muted-foreground">
                              {dict.categories[c.slug].description}
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
              {dict.nav.shops}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[40rem] grid-cols-2 gap-1 p-2">
                {SHOPS.map((s) => (
                  <li key={s.slug}>
                    <NavigationMenuLink
                      render={
                        <Link
                          href={href(`/webshops/${s.slug}`)}
                          className="flex items-start gap-3"
                        >
                          <ShopLogo shop={s} className="h-9 w-24" />
                          <span className="flex flex-col gap-0.5">
                            <span className="font-semibold">{s.name}</span>
                            <span className="line-clamp-2 text-muted-foreground">
                              {dict.shops[s.slug]}
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
                        href={href("/webshops")}
                        className="font-semibold text-primary"
                      >
                        {dict.nav.allShops}
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
              render={<Link href={href("/contact")}>{dict.nav.contact}</Link>}
            />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      {/* Zoekveld: tussen md en lg (menu verborgen) en vanaf xl; tussen lg en xl past het niet
          naast het menu, dan het zoekicoon. */}
      <div className="ml-auto hidden w-full max-w-sm md:block lg:hidden xl:block">
        <SearchForm />
      </div>

      <div className="ml-auto flex shrink-0 items-center md:ml-0 lg:ml-auto xl:ml-0">
        <Link
          href={href("/zoeken")}
          aria-label={dict.nav.search}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-lg" }),
            "md:hidden lg:inline-flex xl:hidden",
          )}
        >
          <Search className="size-5" />
        </Link>
        <LanguageSwitcher />
        {/* Op smalle schermen staat de themakeuze in het menu, zodat alles past. */}
        <ThemeToggle className="hidden sm:inline-flex" />
        <MobileNav />
      </div>
    </div>
  );
}
