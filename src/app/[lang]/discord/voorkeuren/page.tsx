import type { Metadata } from "next";
import { Suspense } from "react";
import { saveDiscordPreferences } from "@/app/[lang]/discord/actions";
import { PageHeader } from "@/components/core/PageHeader";
import { PreferencesForm } from "@/components/preferences/PreferencesForm";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import { isDbConfigured } from "@/lib/db";
import { getWebhookPreferences } from "@/lib/discord";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.preferences.discordTitle, robots: { index: false } };
}

export default async function Page({
  searchParams,
}: PageProps<"/[lang]/discord/voorkeuren">) {
  const { dict } = await getI18n();
  const p = dict.preferences;
  return (
    <>
      <PageHeader
        title={p.discordTitle}
        description={p.discordDescription}
        crumbs={[
          { href: "/discord", label: dict.discord.crumb },
          { href: "/discord/voorkeuren", label: p.crumb },
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
  searchParams: PageProps<"/[lang]/discord/voorkeuren">["searchParams"];
}) {
  const { dict } = await getI18n();
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  const prefs =
    value && isDbConfigured() ? await getWebhookPreferences(value) : null;
  if (!value || !prefs) {
    return <p className="text-lg">{dict.preferences.invalid}</p>;
  }
  return (
    <div className="flex flex-col gap-6">
      {prefs.name ? (
        <p className="text-lg font-semibold">
          {t(dict.preferences.webhook, { name: prefs.name })}
        </p>
      ) : null}
      <PreferencesForm
        token={value}
        initial={prefs}
        action={saveDiscordPreferences}
      />
    </div>
  );
}
