import { BellRing, Link2, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/core/PageHeader";
import { DiscordForm } from "@/components/discord/DiscordForm";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { rich } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, dict } = await getI18n();
  return {
    title: dict.discord.metaTitle,
    description: dict.discord.metaDescription,
    alternates: alternates(lang, "/discord"),
  };
}

const ICONS = [BellRing, ShieldCheck, Link2];

export default async function DiscordPage() {
  const { dict, href } = await getI18n();
  const d = dict.discord;
  return (
    <>
      <PageHeader
        title={d.title}
        description={d.description}
        crumbs={[{ href: "/discord", label: d.crumb }]}
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-10">
        <section className="grid gap-8 rounded-3xl border bg-card p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{d.howTitle}</h2>
            <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-base text-muted-foreground">
              {d.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">{d.permission}</p>
          </div>
          <DiscordForm className="lg:self-center" />
        </section>
        <ul className="grid gap-8 md:grid-cols-3">
          {d.points.map((p, i) => {
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
        <p className="text-muted-foreground">
          {rich(d.mailHint, {
            link: (
              <Link
                href={href("/nieuwsbrief")}
                className="font-semibold text-primary underline"
              >
                {d.mailLink}
              </Link>
            ),
          })}
        </p>
      </div>
    </>
  );
}
