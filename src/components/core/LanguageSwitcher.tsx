"use client";

import { Check, Languages } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/client";
import {
  LOCALE_COOKIE,
  LOCALE_NAMES,
  LOCALES,
  type Locale,
  localePath,
  splitLocale,
} from "@/i18n/config";

/** Taalkeuze: onthoudt de keuze in een cookie (wint van de browsertaal) en opent dezelfde pagina. */
export function LanguageSwitcher() {
  const { lang, dict } = useI18n();
  const pathname = usePathname();

  const choose = (next: Locale) => {
    // biome-ignore lint/suspicious/noDocumentCookie: eenvoudige voorkeur, ook leesbaar in de proxy
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    if (next === lang) return;
    const { path } = splitLocale(pathname);
    window.location.assign(
      localePath(next, path) + window.location.search + window.location.hash,
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={dict.nav.language}
          />
        }
      >
        <Languages className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} onClick={() => choose(l)} lang={l}>
            <span className="w-6 font-mono text-xs font-bold uppercase text-muted-foreground">
              {l}
            </span>
            {LOCALE_NAMES[l]}
            {l === lang ? <Check className="ml-auto" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
