import { Mail, Store, Tag } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/app/[lang]/contact/ContactForm";
import { PageHeader } from "@/components/core/PageHeader";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, dict } = await getI18n();
  return {
    title: dict.contact.title,
    description: dict.contact.metaDescription,
    alternates: alternates(lang, "/contact"),
  };
}

export default async function ContactPage() {
  const { dict } = await getI18n();
  const c = dict.contact;
  return (
    <>
      <PageHeader
        title={c.title}
        icon={<Mail className="size-8 text-primary" />}
        description={c.description}
        crumbs={[{ href: "/contact", label: c.title }]}
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-2xl border bg-card p-5 sm:p-8">
          <ContactForm />
        </div>
        <aside className="flex flex-col gap-4">
          <InfoBlock icon={<Tag className="size-5" />} title={c.priceTitle}>
            {c.priceText}
          </InfoBlock>
          <InfoBlock icon={<Store className="size-5" />} title={c.ownerTitle}>
            {t(c.ownerText, { subject: c.subjects.owner })}
          </InfoBlock>
        </aside>
      </div>
    </>
  );
}

function InfoBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span className="text-primary">{icon}</span> {title}
      </h2>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </div>
  );
}
