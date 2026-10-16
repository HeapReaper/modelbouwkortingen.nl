import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { DealCard } from "@/components/deals/DealCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Deal } from "@/lib/deals";

/** Horizontale rij met deals: swipen op mobiel, pijltjes op desktop. */
export function DealRow({
  title,
  subtitle,
  href,
  deals,
  icon,
}: {
  title: string;
  subtitle?: string;
  href: string;
  deals: Deal[];
  icon?: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4">
      <Carousel
        opts={{ align: "start", dragFree: true }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
              {icon}
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={href}
              className="hidden items-center gap-1 font-semibold text-primary hover:underline sm:flex"
            >
              Bekijk alles <ArrowRight className="size-4" />
            </Link>
            <div className="hidden gap-2 md:flex">
              <CarouselPrevious className="static size-10 translate-y-0" />
              <CarouselNext className="static size-10 translate-y-0" />
            </div>
          </div>
        </div>
        {deals.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            Nog geen deals gevonden. De crawler is op zoek — kom snel terug!
          </p>
        ) : (
          <CarouselContent className="-ml-4">
            {deals.map((d, i) => (
              <CarouselItem
                key={d.id}
                className="basis-[78%] pl-4 min-[420px]:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <DealCard deal={d} eager={i < 2} />
              </CarouselItem>
            ))}
          </CarouselContent>
        )}
        <Link
          href={href}
          className="flex items-center gap-1 self-start font-semibold text-primary hover:underline sm:hidden"
        >
          Bekijk alles <ArrowRight className="size-4" />
        </Link>
      </Carousel>
    </section>
  );
}
