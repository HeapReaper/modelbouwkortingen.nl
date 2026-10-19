import type { Metadata } from "next";
import { Suspense } from "react";
import { verifyAccount } from "@/app/[lang]/account/actions";
import { PageHeader } from "@/components/core/PageHeader";
import { TokenActionForm } from "@/components/newsletter/TokenActionForm";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.account.verifyTitle, robots: { index: false } };
}

export default async function Page({
  searchParams,
}: PageProps<"/[lang]/account/bevestigen">) {
  const { dict } = await getI18n();
  const a = dict.account;
  return (
    <>
      <PageHeader
        title={a.verifyTitle}
        description={a.verifyDescription}
        crumbs={[
          { href: "/account", label: a.title },
          { href: "/account/bevestigen", label: a.verifyTitle },
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
  searchParams: PageProps<"/[lang]/account/bevestigen">["searchParams"];
}) {
  const { dict } = await getI18n();
  const a = dict.account;
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  if (!value) return <p className="text-lg">{a.linkIncomplete}</p>;
  return (
    <TokenActionForm
      token={value}
      action={verifyAccount}
      label={a.verifyButton}
      pendingLabel={a.verifying}
    />
  );
}
