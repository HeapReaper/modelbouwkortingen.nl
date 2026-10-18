import { ExternalLink, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/core/CookieSettingsButton";
import { PageHeader } from "@/components/core/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { rich } from "@/i18n/translate";
import { adsEnabled } from "@/lib/ads";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, dict } = await getI18n();
  return {
    title: dict.privacy.title,
    description: dict.privacy.metaDescription,
    alternates: alternates(lang, "/privacy"),
  };
}

export default async function PrivacyPage() {
  const { dict, href } = await getI18n();
  const p = dict.privacy;
  return (
    <>
      <PageHeader
        title={p.title}
        icon={<ShieldCheck className="size-8 text-primary" />}
        description={p.description}
        crumbs={[{ href: "/privacy", label: p.title }]}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
        <p className="text-sm text-muted-foreground">{p.updated}</p>
        {p.sections.map((s) => (
          <section key={s.title} id={s.id} className="flex flex-col gap-3">
            <h2 className="text-2xl font-black">{s.title}</h2>
            {s.body.map((text) => (
              <p key={text} className="text-base leading-relaxed">
                {text}
              </p>
            ))}
            {s.links ? (
              <ul className="flex flex-col gap-1">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 font-semibold underline hover:text-primary"
                    >
                      {l.label} <ExternalLink className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {s.id === "cookies" && adsEnabled ? (
              <CookieSettingsButton
                label={p.cookieSettings}
                className={buttonVariants({
                  variant: "outline",
                  className: "self-start no-underline hover:no-underline",
                })}
              />
            ) : null}
          </section>
        ))}
        <p className="rounded-2xl border bg-card p-5 text-base">
          {rich(p.contactText, {
            contact: (
              <Link
                href={href("/contact")}
                className="font-semibold underline hover:text-primary"
              >
                {p.contactLink}
              </Link>
            ),
          })}
        </p>
      </div>
    </>
  );
}
