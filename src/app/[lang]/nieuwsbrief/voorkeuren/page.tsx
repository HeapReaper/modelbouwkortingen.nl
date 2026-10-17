import type { Metadata } from "next";
import { Suspense } from "react";
import { saveNewsletterPreferences } from "@/app/[lang]/nieuwsbrief/actions";
import { PageHeader } from "@/components/core/PageHeader";
import { PreferencesForm } from "@/components/preferences/PreferencesForm";
import { getI18n } from "@/i18n/server";
import { isDbConfigured } from "@/lib/db";
import { getPreferences } from "@/lib/newsletter";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.preferences.mailTitle, robots: { index: false } };
}

export default async function Page({
  searchParams,
}: PageProps<"/[lang]/nieuwsbrief/voorkeuren">) {
  const { dict } = await getI18n();
  const p = dict.preferences;
  return (
    <>
      <PageHeader
        title={p.mailTitle}
        description={p.mailDescription}
        crumbs={[
          { href: "/nieuwsbrief", label: dict.newsletter.crumb },
          { href: "/nieuwsbrief/voorkeuren", label: p.crumb },
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Suspense>
          <Preferences searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Preferences({
  searchParams,
}: {
  searchParams: PageProps<"/[lang]/nieuwsbrief/voorkeuren">["searchParams"];
}) {
  const { dict } = await getI18n();
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  const prefs = value && isDbConfigured() ? await getPreferences(value) : null;
  if (!value || !prefs) {
    return <p className="text-lg">{dict.preferences.invalid}</p>;
  }
  return (
    <PreferencesForm
      token={value}
      initial={prefs}
      action={saveNewsletterPreferences}
    />
  );
}
