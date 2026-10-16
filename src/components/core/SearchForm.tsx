import { Search } from "lucide-react";
import Form from "next/form";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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
  const lg = size === "lg";
  return (
    <Form
      action="/zoeken"
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
            lg
              ? "Zoek bijv. Arrma Kraton, LiPo 4S, Spektrum…"
              : "Zoek een deal…"
          }
          aria-label="Zoek naar aanbiedingen"
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
        Zoeken
      </Button>
    </Form>
  );
}
