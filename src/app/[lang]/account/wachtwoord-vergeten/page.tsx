import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/account/AccountForms";
import { PageHeader } from "@/components/core/PageHeader";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.account.forgotTitle, robots: { index: false } };
}

export default async function Page() {
  const { dict } = await getI18n();
  const a = dict.account;
  return (
    <>
      <PageHeader
        title={a.forgotTitle}
        description={a.forgotDescription}
        crumbs={[
          { href: "/account", label: a.title },
          { href: "/account/wachtwoord-vergeten", label: a.forgotTitle },
        ]}
      />
      <div className="mx-auto max-w-md px-4 py-10">
        <ForgotPasswordForm />
      </div>
    </>
  );
}
