import type { Metadata } from "next";
import { Suspense } from "react";
import { confirmPriceAlert } from "@/app/[lang]/prijsalarm/actions";
import { PageHeader } from "@/components/core/PageHeader";
import { TokenActionForm } from "@/components/newsletter/TokenActionForm";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.priceAlert.confirmTitle, robots: { index: false } };
}

export default async function Page({
  searchParams,
}: PageProps<"/[lang]/prijsalarm/bevestigen">) {
  const { dict } = await getI18n();
  const a = dict.priceAlert;
  return (
    <>
      <PageHeader
        title={a.confirmTitle}
        description={a.confirmDescription}
        crumbs={[{ href: "/prijsalarm/bevestigen", label: a.confirmCrumb }]}
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
  searchParams: PageProps<"/[lang]/prijsalarm/bevestigen">["searchParams"];
}) {
  const { dict } = await getI18n();
  const a = dict.priceAlert;
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  if (!value) {
    return <p className="text-lg">{a.confirmMissing}</p>;
  }
  return (
    <TokenActionForm
      token={value}
      action={confirmPriceAlert}
      label={a.confirmButton}
      pendingLabel={a.confirmPending}
    />
  );
}
