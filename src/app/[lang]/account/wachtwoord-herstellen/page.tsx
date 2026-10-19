import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/account/AccountForms";
import { PageHeader } from "@/components/core/PageHeader";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.account.resetTitle, robots: { index: false } };
}

export default async function Page({
  searchParams,
}: PageProps<"/[lang]/account/wachtwoord-herstellen">) {
  const { dict } = await getI18n();
  const a = dict.account;
  return (
    <>
      <PageHeader
        title={a.resetTitle}
        description={a.resetDescription}
        crumbs={[
          { href: "/account", label: a.title },
          { href: "/account/wachtwoord-herstellen", label: a.resetTitle },
        ]}
      />
      <div className="mx-auto max-w-md px-4 py-10">
        <Suspense>
          <Reset searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Reset({
  searchParams,
}: {
  searchParams: PageProps<"/[lang]/account/wachtwoord-herstellen">["searchParams"];
}) {
  const { dict, href } = await getI18n();
  const a = dict.account;
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  if (!value) {
    return (
      <p className="text-lg">
        {a.linkIncomplete}{" "}
        <Link
          href={href("/account/wachtwoord-vergeten")}
          className="font-semibold text-primary hover:underline"
        >
          {a.forgotLink}
        </Link>
      </p>
    );
  }
  return <ResetPasswordForm token={value} />;
}
