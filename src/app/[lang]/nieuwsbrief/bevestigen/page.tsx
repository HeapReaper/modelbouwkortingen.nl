import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { confirmNewsletter } from "@/app/[lang]/nieuwsbrief/actions";
import { PageHeader } from "@/components/core/PageHeader";
import { TokenActionForm } from "@/components/newsletter/TokenActionForm";
import { getI18n } from "@/i18n/server";
import { rich } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.newsletter.confirmTitle, robots: { index: false } };
}

export default async function Page({
  searchParams,
}: PageProps<"/[lang]/nieuwsbrief/bevestigen">) {
  const { dict } = await getI18n();
  const x = dict.newsletter;
  return (
    <>
      <PageHeader
        title={x.confirmTitle}
        description={x.confirmDescription}
        crumbs={[
          { href: "/nieuwsbrief", label: x.crumb },
          { href: "/nieuwsbrief/bevestigen", label: x.confirmCrumb },
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Suspense>
          <TokenForm searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function TokenForm({
  searchParams,
}: {
  searchParams: PageProps<"/[lang]/nieuwsbrief/bevestigen">["searchParams"];
}) {
  const { dict, href } = await getI18n();
  const x = dict.newsletter;
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  if (!value) {
    return <p className="text-lg">{x.confirmMissing}</p>;
  }
  return (
    <div className="flex flex-col gap-6">
      <TokenActionForm
        token={value}
        action={confirmNewsletter}
        label={x.confirmButton}
        pendingLabel={x.confirmPending}
      />
      <p className="text-muted-foreground">
        {rich(x.preferencesHint, {
          link: (
            <Link
              href={`${href("/nieuwsbrief/voorkeuren")}?token=${encodeURIComponent(value)}`}
              className="font-semibold text-primary underline"
            >
              {x.preferencesLink}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
