import type { Metadata } from "next";
import { Suspense } from "react";
import { unsubscribeNewsletter } from "@/app/nieuwsbrief/actions";
import { PageHeader } from "@/components/core/PageHeader";
import { TokenActionForm } from "@/components/newsletter/TokenActionForm";

export const metadata: Metadata = {
  title: "Afmelden",
  robots: { index: false },
};

export default function AfmeldenPage({
  searchParams,
}: PageProps<"/nieuwsbrief/afmelden">) {
  return (
    <>
      <PageHeader
        title="Afmelden voor de kortingsmail"
        description="Jammer dat je gaat! Na het afmelden sturen we je geen kortingsmails meer."
        crumbs={[
          { href: "/nieuwsbrief", label: "Kortingsmail" },
          { href: "/nieuwsbrief/afmelden", label: "Afmelden" },
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Suspense>
          <Unsubscribe searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Unsubscribe({
  searchParams,
}: {
  searchParams: PageProps<"/nieuwsbrief/afmelden">["searchParams"];
}) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  if (!value) {
    return (
      <p className="text-lg">
        Deze link is onvolledig. Gebruik de afmeldlink onderaan een van onze
        mails.
      </p>
    );
  }
  return (
    <TokenActionForm
      token={value}
      action={unsubscribeNewsletter}
      label="Afmelden"
      pendingLabel="Afmelden…"
      variant="outline"
    />
  );
}
