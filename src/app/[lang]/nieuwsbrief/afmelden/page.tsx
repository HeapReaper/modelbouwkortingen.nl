import type { Metadata } from "next";
import { Suspense } from "react";
import { unsubscribeNewsletter } from "@/app/[lang]/nieuwsbrief/actions";
import { PageHeader } from "@/components/core/PageHeader";
import { TokenActionForm } from "@/components/newsletter/TokenActionForm";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return {
    title: dict.newsletter.unsubscribeMetaTitle,
    robots: { index: false },
  };
}

export default async function Page({
  searchParams,
}: PageProps<"/[lang]/nieuwsbrief/afmelden">) {
  const { dict } = await getI18n();
  const x = dict.newsletter;
  return (
    <>
      <PageHeader
        title={x.unsubscribeTitle}
        description={x.unsubscribeDescription}
        crumbs={[
          { href: "/nieuwsbrief", label: x.crumb },
          { href: "/nieuwsbrief/afmelden", label: x.unsubscribeCrumb },
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
  searchParams: PageProps<"/[lang]/nieuwsbrief/afmelden">["searchParams"];
}) {
  const { dict } = await getI18n();
  const x = dict.newsletter;
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  if (!value) {
    return <p className="text-lg">{x.unsubscribeMissing}</p>;
  }
  return (
    <TokenActionForm
      token={value}
      action={unsubscribeNewsletter}
      label={x.unsubscribeButton}
      pendingLabel={x.unsubscribePending}
      variant="outline"
    />
  );
}
