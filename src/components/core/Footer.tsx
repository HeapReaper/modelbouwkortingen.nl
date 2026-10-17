import Link from "next/link";
import { CurrentYear } from "@/components/core/CurrentYear";
import { Logo } from "@/components/core/Logo";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { getI18n } from "@/i18n/server";
import { CATEGORIES } from "@/lib/categories";
import { SHOPS } from "@/lib/shops";

export default async function Footer() {
  const { lang, dict, href } = await getI18n();
  const f = dict.footer;
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="border-b">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold">{f.newsletterTitle}</h2>
            <p className="text-muted-foreground">{f.newsletterText}</p>
          </div>
          <NewsletterForm className="w-full lg:max-w-md" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="text-muted-foreground">{f.about}</p>
        </div>
        <FooterList
          title={f.categories}
          links={CATEGORIES.slice(0, 7).map((c) => ({
            href: href(`/categorie/${c.slug}`),
            label: dict.categories[c.slug].name,
          }))}
        />
        <FooterList
          title={f.shops}
          links={[
            ...SHOPS.map((s) => ({
              href: href(`/webshops/${s.slug}`),
              label: s.name,
            })),
            { href: href("/webshops"), label: f.allShops },
          ]}
        />
        <FooterList
          title={f.site}
          links={[
            { href: href("/aanbiedingen"), label: f.allDeals },
            { href: href("/prijsvergelijker"), label: f.compare },
            { href: href("/merken"), label: f.brands },
            { href: href("/volglijst"), label: f.watchlist },
            { href: href("/nieuwsbrief"), label: f.newsletter },
            { href: href("/discord"), label: f.discord },
            {
              href: `/feed.xml${lang === "nl" ? "" : `?lang=${lang}`}`,
              label: f.rss,
              plain: true,
            },
            { href: href("/over"), label: f.howItWorks },
            { href: href("/over#webshops"), label: f.forShops },
            { href: href("/contact"), label: f.contact },
          ]}
        />
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>
            © <CurrentYear /> Modelbouwkortingen.nl — {f.rights}
          </p>
          <p>{f.disclaimer}</p>
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
  /** `plain`: gewone link, geen pagina van de app (zoals de RSS-feed). */
  links: { href: string; label: string; plain?: boolean }[];
}) {
  return (
    <div>
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.href}>
            {l.plain ? (
              <a
                href={l.href}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                {l.label}
              </a>
            ) : (
              <Link
                href={l.href}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
