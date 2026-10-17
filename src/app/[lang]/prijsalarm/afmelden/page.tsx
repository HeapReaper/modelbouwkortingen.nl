import type { Metadata } from "next";
import { Suspense } from "react";
import { cancelPriceAlert } from "@/app/[lang]/prijsalarm/actions";
import { PageHeader } from "@/components/core/PageHeader";
import { TokenActionForm } from "@/components/newsletter/TokenActionForm";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.priceAlert.cancelTitle, robots: { index: false } };
}

export default async function Page({
  searchParams,
}: PageProps<"/[lang]/prijsalarm/afmelden">) {
  const { dict } = await getI18n();
  const a = dict.priceAlert;
  return (
    <>
      <PageHeader
        title={a.cancelTitle}
        description={a.cancelDescription}
        crumbs={[{ href: "/prijsalarm/afmelden", label: a.cancelCrumb }]}
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
  searchParams: PageProps<"/[lang]/prijsalarm/afmelden">["searchParams"];
}) {
  const { dict } = await getI18n();
  const a = dict.priceAlert;
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  if (!value) {
    return <p className="text-lg">{a.cancelMissing}</p>;
  }
  return (
    <TokenActionForm
      token={value}
      action={cancelPriceAlert}
      label={a.cancelButton}
      pendingLabel={a.cancelPending}
      variant="outline"
    />
  );
}
