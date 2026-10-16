import Link from "next/link";
import { SearchForm } from "@/components/core/SearchForm";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p className="price-tag bg-primary py-2 pr-5 pl-8 font-heading text-6xl font-black text-primary-foreground">
        404
      </p>
      <h1 className="text-3xl font-black">Oeps! Deze pagina bestaat niet.</h1>
      <p className="text-lg text-muted-foreground">
        Misschien is de aanbieding verlopen of is de link veranderd. Zoek
        hieronder verder of bekijk alle deals.
      </p>
      <SearchForm className="w-full" />
      <Link href="/aanbiedingen" className={buttonVariants({ size: "lg" })}>
        Alle aanbiedingen bekijken
      </Link>
    </div>
  );
}
