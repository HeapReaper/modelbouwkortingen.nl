import type { Metadata } from "next";
import { Suspense } from "react";
import { unsubscribeDiscord } from "@/app/discord/actions";
import { PageHeader } from "@/components/core/PageHeader";
import { TokenActionForm } from "@/components/newsletter/TokenActionForm";

export const metadata: Metadata = {
  title: "Discord-meldingen stoppen",
  robots: { index: false },
};

export default function DiscordAfmeldenPage({
  searchParams,
}: PageProps<"/discord/afmelden">) {
  return (
    <>
      <PageHeader
        title="Discord-meldingen stoppen"
        description="Na het afmelden posten we geen deals meer in dit kanaal. De webhook zelf kun je daarna in Discord verwijderen."
        crumbs={[
          { href: "/discord", label: "Discord" },
          { href: "/discord/afmelden", label: "Afmelden" },
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
  searchParams: PageProps<"/discord/afmelden">["searchParams"];
}) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  if (!value) {
    return (
      <p className="text-lg">
        Deze link is onvolledig. Gebruik de afmeldlink uit het welkomstbericht
        in je Discord-kanaal.
      </p>
    );
  }
  return (
    <TokenActionForm
      token={value}
      action={unsubscribeDiscord}
      label="Meldingen stoppen"
      pendingLabel="Afmelden…"
      variant="outline"
    />
  );
}
