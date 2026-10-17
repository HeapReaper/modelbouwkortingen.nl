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
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { rich } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, dict } = await getI18n();
  return {
    title: dict.about.title,
    description: dict.about.metaDescription,
    alternates: alternates(lang, "/over"),
  };
}

const code = (text: string) => (
  <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{text}</code>
);

export default async function OverPage() {
  const { dict, href } = await getI18n();
  const a = dict.about;
  return (
    <>
      <PageHeader
        title={a.title}
        icon={<HelpCircle className="size-8 text-primary" />}
        description={a.description}
        crumbs={[{ href: "/over", label: a.title }]}
      />
      <div className="flex flex-col gap-14 py-10">
        <HowItWorks />

        <section className="mx-auto w-full max-w-3xl px-4">
          <h2 className="mb-4 text-2xl font-black">{a.faqTitle}</h2>
          <Accordion className="rounded-2xl border bg-card px-5">
            {a.faq.map((f) => (
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
              <Bot className="size-7 text-primary" /> {a.forShopsTitle}
            </h2>
            <div className="mt-4 flex flex-col gap-3 text-base">
              <p>
                {rich(a.crawlerIntro, {
                  userAgent: code("ModelbouwkortingenBot/1.0"),
                  from: code("From"),
                })}
              </p>
              <ul className="list-disc space-y-1 pl-6">
                {a.crawlerRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
              <p>
                {rich(a.crawlerContact, {
                  contact: (
                    <Link
                      href={href("/contact")}
                      className="font-semibold text-primary underline"
                    >
                      {a.crawlerContactLink}
                    </Link>
                  ),
                  robots: code("User-agent: ModelbouwkortingenBot"),
                })}
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
