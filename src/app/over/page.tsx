import { Bot, HelpCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/core/PageHeader";
import { HowItWorks } from "@/components/home/HowItWorks";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Hoe werkt het?",
  description:
    "Zo vindt Modelbouwkortingen.nl de beste RC-aanbiedingen, en informatie voor webshops over onze crawler.",
};

const FAQ = [
  {
    q: "Wanneer staat een product op Modelbouwkortingen.nl?",
    a: "Wij houden de prijzen zelf bij. Een product verschijnt pas als de prijs minstens €5 óf 5% zakt ten opzichte van de prijs die wij eerder bij die webshop zagen (de hoogste van de afgelopen 30 dagen). Een 'van'-prijs die de webshop zelf toont tellen we niet mee. Het product blijft staan tot de prijs weer stijgt.",
  },
  {
    q: "Hoe vaak worden de prijzen bijgewerkt?",
    a: "Onze crawler draait de hele dag door. Populaire aanbiedingen worden meerdere keren per dag gecontroleerd, het volledige assortiment minstens een paar keer per week.",
  },
  {
    q: "Kost het mij iets?",
    a: "Nee. Je bestelt gewoon direct bij de webshop, tegen dezelfde prijs als altijd.",
  },
  {
    q: "De prijs in de webshop is anders dan hier. Hoe kan dat?",
    a: "Aanbiedingen kunnen snel veranderen. De prijs op de website van de webshop is altijd leidend. Zie je een fout? Laat het ons weten via het contactformulier.",
  },
  {
    q: "Mijn favoriete webshop staat er niet tussen.",
    a: "Laat het ons weten! We breiden het aantal webshops regelmatig uit.",
  },
];

export default function OverPage() {
  return (
    <>
      <PageHeader
        title="Hoe werkt het?"
        icon={<HelpCircle className="size-8 text-primary" />}
        description="Modelbouwkortingen.nl verzamelt automatisch RC-aanbiedingen van Nederlandse en Duitse modelbouw-webshops, zodat jij niet overal hoeft te zoeken."
        crumbs={[{ href: "/over", label: "Hoe werkt het?" }]}
      />
      <div className="flex flex-col gap-14 py-10">
        <HowItWorks />

        <section className="mx-auto w-full max-w-3xl px-4">
          <h2 className="mb-4 text-2xl font-black">Veelgestelde vragen</h2>
          <Accordion className="rounded-2xl border bg-card px-5">
            {FAQ.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-base font-bold">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section
          id="webshops"
          className="mx-auto w-full max-w-3xl scroll-mt-28 px-4"
        >
          <div className="rounded-2xl border-2 border-primary/30 bg-card p-6">
            <h2 className="flex items-center gap-2 text-2xl font-black">
              <Bot className="size-7 text-primary" /> Informatie voor webshops
            </h2>
            <div className="mt-4 flex flex-col gap-3 text-base">
              <p>
                Onze crawler identificeert zich met de user-agent{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                  ModelbouwkortingenBot/1.0
                </code>{" "}
                met een verwijzing naar deze pagina, en stuurt een{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                  From
                </code>
                -header met ons contactadres.
              </p>
              <ul className="list-disc space-y-1 pl-6">
                <li>We respecteren robots.txt, ook bij redirects.</li>
                <li>
                  We bezoeken per webshop maximaal enkele pagina's per seconde.
                </li>
                <li>
                  Bij een HTTP 429 of 503 pauzeren we automatisch (5, 10, 20
                  seconden, …) en gaan we daarna rustiger verder.
                </li>
                <li>
                  We lezen alleen publieke productinformatie: naam, prijs,
                  afbeelding en categorie.
                </li>
                <li>
                  Elke deal linkt direct naar de productpagina in jouw webshop.
                </li>
              </ul>
              <p>
                Wil je dat we je webshop anders of niet meer crawlen, of wil je
                juist toegevoegd worden? Neem dan{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-primary underline"
                >
                  contact met ons op
                </Link>{" "}
                — we reageren snel. Je kunt ons ook blokkeren via robots.txt met{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
                  User-agent: ModelbouwkortingenBot
                </code>
                .
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
