import { BellRing, MailCheck, MousePointerClick } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/core/PageHeader";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { rich } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, dict } = await getI18n();
  return {
    title: dict.newsletter.metaTitle,
    description: dict.newsletter.metaDescription,
    alternates: alternates(lang, "/nieuwsbrief"),
  };
}

const ICONS = [BellRing, MailCheck, MousePointerClick];

export default async function NieuwsbriefPage() {
  const { dict, href } = await getI18n();
  const n = dict.newsletter;
  return (
    <>
      <PageHeader
        title={n.title}
        description={n.description}
        crumbs={[{ href: "/nieuwsbrief", label: n.crumb }]}
      />
      <div className="flex flex-col gap-12 py-10">
        <NewsletterSignup />
        <p className="mx-auto w-full max-w-7xl px-4 text-muted-foreground">
          {rich(n.discordHint, {
            link: (
              <Link
                href={href("/discord")}
                className="font-semibold text-primary underline"
              >
                {n.discordLink}
              </Link>
            ),
          })}
        </p>
        <ul className="mx-auto grid w-full max-w-7xl gap-8 px-4 md:grid-cols-3">
          {n.points.map((p, i) => {
            const Icon = ICONS[i];
            return (
              <li key={p.title} className="flex flex-col gap-2">
                <Icon className="size-7 text-primary" />
                <h2 className="text-xl font-bold">{p.title}</h2>
                <p className="text-muted-foreground">{p.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
