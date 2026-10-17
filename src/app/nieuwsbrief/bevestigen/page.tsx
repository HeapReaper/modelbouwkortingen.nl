import type { Metadata } from "next";
import { Suspense } from "react";
import { confirmNewsletter } from "@/app/nieuwsbrief/actions";
import { PageHeader } from "@/components/core/PageHeader";
import { TokenActionForm } from "@/components/newsletter/TokenActionForm";

export const metadata: Metadata = {
  title: "Aanmelding bevestigen",
  robots: { index: false },
};

export default function BevestigenPage({
  searchParams,
}: PageProps<"/nieuwsbrief/bevestigen">) {
  return (
    <>
      <PageHeader
        title="Aanmelding bevestigen"
        description="Nog één klik en je ontvangt elke ochtend de grootste RC-kortingen."
        crumbs={[
          { href: "/nieuwsbrief", label: "Kortingsmail" },
          { href: "/nieuwsbrief/bevestigen", label: "Bevestigen" },
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Suspense>
          <Confirm searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Confirm({
  searchParams,
}: {
  searchParams: PageProps<"/nieuwsbrief/bevestigen">["searchParams"];
}) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  if (!value) {
    return (
      <p className="text-lg">
        Deze link is onvolledig. Open de link uit de bevestigingsmail opnieuw.
      </p>
    );
  }
  return (
    <TokenActionForm
      token={value}
      action={confirmNewsletter}
      label="Ja, stuur mij de dagelijkse deals"
      pendingLabel="Bevestigen…"
    />
  );
}
