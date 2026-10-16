import { Store } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/core/PageHeader";
import { ShopCards } from "@/components/home/ShopCards";

export const metadata: Metadata = {
  title: "Webshops",
  description:
    "Deze RC- en modelbouwwebshops houden wij dagelijks in de gaten.",
};

export default function WebshopsPage() {
  return (
    <>
      <PageHeader
        title="Webshops"
        icon={<Store className="size-8 text-primary" />}
        description="Deze modelbouw-webshops houden wij dagelijks in de gaten. Kies een webshop om al zijn aanbiedingen te zien."
        crumbs={[{ href: "/webshops", label: "Webshops" }]}
      />
      <div className="py-10">
        <ShopCards title="Alle webshops" />
        <p className="mx-auto mt-8 max-w-7xl px-4 text-muted-foreground">
          Mis je een webshop? Laat het ons weten via het{" "}
          <a href="/contact" className="font-semibold text-primary underline">
            contactformulier
          </a>
          .
        </p>
      </div>
    </>
  );
}
