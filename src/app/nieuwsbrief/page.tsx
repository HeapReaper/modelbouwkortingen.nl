import { BellRing, MailCheck, MousePointerClick } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/core/PageHeader";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";

export const metadata: Metadata = {
  title: "Dagelijkse kortingsmail",
  description:
    "Ontvang elke ochtend de grootste nieuwe RC-aanbiedingen van de Nederlandse en Duitse modelbouw-webshops in je mail.",
};

const POINTS = [
  {
    icon: BellRing,
    title: "Eén mail per dag",
    text: "Elke ochtend de hoogste nieuwe kortingen. Is er niets nieuws, dan sturen we niets.",
  },
  {
    icon: MailCheck,
    title: "Alleen met jouw bevestiging",
    text: "Na het aanmelden krijg je een bevestigingsmail. Pas na jouw klik sturen we deals.",
  },
  {
    icon: MousePointerClick,
    title: "Afmelden met één klik",
    text: "Onderaan elke mail staat een afmeldlink. We gebruiken je adres alleen voor deze mail.",
  },
];

export default function NieuwsbriefPage() {
  return (
    <>
      <PageHeader
        title="Dagelijkse kortingsmail"
        description="Mis nooit meer een RC-deal: de grootste nieuwe aanbiedingen elke ochtend in je inbox."
        crumbs={[{ href: "/nieuwsbrief", label: "Kortingsmail" }]}
      />
      <div className="flex flex-col gap-12 py-10">
        <NewsletterSignup />
        <ul className="mx-auto grid w-full max-w-7xl gap-8 px-4 md:grid-cols-3">
          {POINTS.map((p) => (
            <li key={p.title} className="flex flex-col gap-2">
              <p.icon className="size-7 text-primary" />
              <h2 className="text-xl font-bold">{p.title}</h2>
              <p className="text-muted-foreground">{p.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
