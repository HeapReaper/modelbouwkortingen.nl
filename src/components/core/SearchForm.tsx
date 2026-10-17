"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Zoekformulier dat naar /zoeken navigeert (werkt ook zonder JavaScript). */
export function SearchForm({
  defaultValue,
  size = "default",
  className,
  autoFocus,
}: {
  defaultValue?: string;
  size?: "default" | "lg";
  className?: string;
  autoFocus?: boolean;
}) {
  const { dict, href } = useI18n();
  const lg = size === "lg";
  return (
    <Form
      action={href("/zoeken")}
      role="search"
      className={cn("flex w-full gap-2", className)}
    >
      <InputGroup
        className={cn("bg-background", lg ? "h-14 rounded-xl" : "h-10")}
      >
        <InputGroupAddon>
          <Search className={lg ? "size-5" : "size-4"} />
        </InputGroupAddon>
        <InputGroupInput
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={
            lg ? dict.search.placeholderLarge : dict.search.placeholder
          }
          aria-label={dict.search.label}
          autoComplete="off"
          enterKeyHint="search"
          autoFocus={autoFocus}
          className={lg ? "text-lg" : "text-base"}
        />
      </InputGroup>
      <Button
        type="submit"
        size="lg"
        className={cn(lg ? "h-14 px-6 text-base font-bold" : "h-10 px-4")}
      >
        {dict.search.button}
      </Button>
    </Form>
  );
}
