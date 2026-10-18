import { Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/core/PageHeader";
import { ShopCards } from "@/components/home/ShopCards";
import { FeaturedShops } from "@/components/promo/FeaturedShops";
import { alternates } from "@/i18n/metadata";
import { getI18n } from "@/i18n/server";
import { rich } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, dict } = await getI18n();
  return {
    title: dict.shopsPage.title,
    description: dict.shopsPage.metaDescription,
    alternates: alternates(lang, "/webshops"),
  };
}

export default async function WebshopsPage() {
  const { dict, href } = await getI18n();
  return (
    <>
      <PageHeader
        title={dict.shopsPage.title}
        icon={<Store className="size-8 text-primary" />}
        description={dict.shopsPage.description}
        crumbs={[{ href: "/webshops", label: dict.shopsPage.title }]}
      />
      <div className="py-10">
        <Suspense fallback={null}>
          <FeaturedShops className="mb-12" />
        </Suspense>
        <ShopCards title={dict.shopsPage.allTitle} />
        <p className="mx-auto mt-8 max-w-7xl px-4 text-muted-foreground">
          {rich(dict.shopsPage.missing, {
            link: (
              <Link
                href={href("/contact")}
                className="font-semibold text-primary underline"
              >
                {dict.shopsPage.missingLink}
              </Link>
            ),
          })}
        </p>
      </div>
    </>
  );
}
