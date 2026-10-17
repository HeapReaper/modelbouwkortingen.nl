import Link from "next/link";
import { CurrentYear } from "@/components/core/CurrentYear";
import { Logo } from "@/components/core/Logo";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { CATEGORIES } from "@/lib/categories";
import { SHOPS } from "@/lib/shops";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="border-b">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold">Dagelijkse kortingsmail</h2>
            <p className="text-muted-foreground">
              Elke ochtend de grootste nieuwe RC-deals in je inbox.
            </p>
          </div>
          <NewsletterForm className="w-full lg:max-w-md" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="text-muted-foreground">
            Wij speuren dagelijks de grote RC-webshops af en tonen alleen
            producten die écht afgeprijsd zijn: minstens €5 of 5% goedkoper.
          </p>
        </div>
        <FooterList
          title="Categorieën"
          links={CATEGORIES.slice(0, 7).map((c) => ({
            href: `/categorie/${c.slug}`,
            label: c.name,
          }))}
        />
        <FooterList
          title="Webshops"
          links={[
            ...SHOPS.map((s) => ({
              href: `/webshops/${s.slug}`,
              label: s.name,
            })),
            { href: "/webshops", label: "Alle webshops" },
          ]}
        />
        <FooterList
          title="Modelbouwkortingen"
          links={[
            { href: "/aanbiedingen", label: "Alle aanbiedingen" },
            { href: "/nieuwsbrief", label: "Dagelijkse kortingsmail" },
            { href: "/over", label: "Hoe werkt het?" },
            { href: "/over#webshops", label: "Voor webshops" },
            { href: "/contact", label: "Contact" },
          ]}
        />
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>
            © <CurrentYear /> Modelbouwkortingen.nl — Alle rechten voorbehouden.
          </p>
          <p>
            Prijzen en voorraad kunnen afwijken. De prijs in de webshop is
            altijd leidend.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterList({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-muted-foreground hover:text-foreground hover:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
