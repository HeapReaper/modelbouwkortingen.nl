import { Mail, Store, Tag } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/app/contact/ContactForm";
import { PageHeader } from "@/components/core/PageHeader";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Vraag, tip of opmerking? Neem contact op met Modelbouwkortingen.nl.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact"
        icon={<Mail className="size-8 text-primary" />}
        description="Een vraag, een deal die niet klopt of een webshop die je mist? Laat het ons weten."
        crumbs={[{ href: "/contact", label: "Contact" }]}
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-2xl border bg-card p-5 sm:p-8">
          <ContactForm />
        </div>
        <aside className="flex flex-col gap-4">
          <InfoBlock
            icon={<Tag className="size-5" />}
            title="Klopt een prijs niet?"
          >
            We verzamelen prijzen automatisch. Het kan dus gebeuren dat een
            aanbieding net verlopen is. Laat het ons weten, dan kijken we
            ernaar.
          </InfoBlock>
          <InfoBlock
            icon={<Store className="size-5" />}
            title="Webshop-eigenaar?"
          >
            Wil je jouw webshop toevoegen, iets aanpassen of juist niet meer
            vermeld worden? Kies &quot;Ik ben webshop-eigenaar&quot; als
            onderwerp, dan regelen we het snel.
          </InfoBlock>
        </aside>
      </div>
    </>
  );
}

function InfoBlock({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span className="text-primary">{icon}</span> {title}
      </h2>
      <p className="mt-2 text-muted-foreground">{children}</p>
    </div>
  );
}
