"use client";

import Image from "next/image";
import Link from "next/link";
import type * as React from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export default function Navbar() {
  return (
    <nav className="flex w-full items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/logo.png" alt="Modelbouwkortingen.nl logo" width={40} height={40} priority />

        <span className="text-lg font-bold tracking-tight">Modelbouwkortingen.nl</span>
      </Link>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              render={<Link href="/">Home</Link>}
            />
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Webshops</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-96">
                <ListItem href="/webshops/toprc" title="TopRC"></ListItem>
                <ListItem href="/webshops/toemen" title="Toemen"></ListItem>
                <ListItem href="/webshops/wetronics" title="Wetronics"></ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              render={<Link href="/contact">Contact</Link>}
            />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink
        render={
          <Link href={href}>
            <div className="flex flex-col gap-1 text-sm">
              <div className="leading-none font-medium">{title}</div>
              <div className="line-clamp-2 text-muted-foreground">{children}</div>
            </div>
          </Link>
        }
      />
    </li>
  );
}
