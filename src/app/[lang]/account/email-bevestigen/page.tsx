import type { Metadata } from "next";
import { Suspense } from "react";
import { confirmAccountEmail } from "@/app/[lang]/account/actions";
import { PageHeader } from "@/components/core/PageHeader";
import { TokenActionForm } from "@/components/newsletter/TokenActionForm";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.account.emailConfirmTitle, robots: { index: false } };
}

export default async function Page({
  searchParams,
}: PageProps<"/[lang]/account/email-bevestigen">) {
  const { dict } = await getI18n();
  const a = dict.account;
  return (
    <>
      <PageHeader
        title={a.emailConfirmTitle}
        description={a.emailConfirmDescription}
        crumbs={[
          { href: "/account", label: a.title },
          { href: "/account/email-bevestigen", label: a.emailConfirmTitle },
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
  searchParams: PageProps<"/[lang]/account/email-bevestigen">["searchParams"];
}) {
  const { dict } = await getI18n();
  const a = dict.account;
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  if (!value) return <p className="text-lg">{a.linkIncomplete}</p>;
  return (
    <TokenActionForm
      token={value}
      action={confirmAccountEmail}
      label={a.emailConfirmButton}
      pendingLabel={a.emailConfirming}
    />
  );
}
