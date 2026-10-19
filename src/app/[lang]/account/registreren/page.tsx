import { UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/account/AccountForms";
import { PageHeader } from "@/components/core/PageHeader";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.account.registerTitle, robots: { index: false } };
}

export default async function Page() {
  const { dict, href } = await getI18n();
  const a = dict.account;
  return (
    <>
      <PageHeader
        title={a.registerTitle}
        icon={<UserPlus className="size-8 text-primary" />}
        description={a.registerPitch}
        crumbs={[
          { href: "/account", label: a.title },
          { href: "/account/registreren", label: a.registerTitle },
        ]}
      />
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
        <RegisterForm />
        <p className="text-sm">
          {a.haveAccount}{" "}
          <Link
            href={href("/account")}
            className="font-semibold text-primary hover:underline"
          >
            {a.login}
          </Link>
        </p>
      </div>
    </>
  );
}
