import { BellRing, Link2, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/core/PageHeader";
import { DiscordForm } from "@/components/discord/DiscordForm";

export const metadata: Metadata = {
  title: "Deals in je Discord",
  description:
    "Koppel een Discord-webhook en krijg elke nieuwe RC-aanbieding direct als bericht in je eigen Discord-kanaal.",
};

const STEPS = [
  "Open in Discord de instellingen van het kanaal waar de deals moeten komen.",
  "Ga naar Integraties → Webhooks → Nieuwe webhook.",
  "Geef hem eventueel een naam en klik op Webhook-URL kopiëren.",
  "Plak de URL in het veld en klik op Koppelen.",
];

const POINTS = [
  {
    icon: BellRing,
    title: "Elke nieuwe deal",
    text: "Binnen een paar minuten nadat we een prijsdaling spotten, met prijs, korting en foto.",
  },
  {
    icon: ShieldCheck,
    title: "Alleen in jouw kanaal",
    text: "De webhook kan alleen berichten plaatsen; we lezen niets en noemen niemand.",
  },
  {
    icon: Link2,
    title: "Stoppen kan altijd",
    text: "Via de afmeldlink in het welkomstbericht, of verwijder de webhook in Discord.",
  },
];

export default function DiscordPage() {
  return (
    <>
      <PageHeader
        title="Deals in je Discord"
        description="Koppel een Discord-webhook en elke nieuwe RC-aanbieding verschijnt direct in je eigen kanaal."
        crumbs={[{ href: "/discord", label: "Discord" }]}
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-10">
        <section className="grid gap-8 rounded-3xl border bg-card p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              Zo maak je een webhook
            </h2>
            <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-base text-muted-foreground">
              {STEPS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              Je hebt daarvoor de rechten &quot;Webhooks beheren&quot; nodig in
              die server.
            </p>
          </div>
          <DiscordForm className="lg:self-center" />
        </section>
        <ul className="grid gap-8 md:grid-cols-3">
          {POINTS.map((p) => (
            <li key={p.title} className="flex flex-col gap-2">
              <p.icon className="size-7 text-primary" />
              <h2 className="text-xl font-bold">{p.title}</h2>
              <p className="text-muted-foreground">{p.text}</p>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground">
          Liever één mail per dag met de hoogste kortingen? Meld je aan voor de{" "}
          <Link
            href="/nieuwsbrief"
            className="font-semibold text-primary underline"
          >
            dagelijkse kortingsmail
          </Link>
          .
        </p>
      </div>
    </>
  );
}
