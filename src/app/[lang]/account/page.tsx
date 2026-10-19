import {
  AtSign,
  BellRing,
  Heart,
  KeyRound,
  Mail,
  Trash2,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { saveNewsletterPreferences } from "@/app/[lang]/nieuwsbrief/actions";
import {
  AlertList,
  ChangeEmailForm,
  ChangePasswordForm,
  DeleteAccountForm,
  LoginForm,
  LogoutButton,
  NewsletterSwitch,
} from "@/components/account/AccountForms";
import { PageHeader } from "@/components/core/PageHeader";
import { PreferencesForm } from "@/components/preferences/PreferencesForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getI18n } from "@/i18n/server";
import { t } from "@/i18n/translate";
import { getAlerts, getNewsletter, getWatchlist } from "@/lib/account";
import { type CurrentUser, getCurrentUser } from "@/lib/auth";
import { isDbConfigured } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.account.title, robots: { index: false } };
}

export default async function AccountPage({
  searchParams,
}: PageProps<"/[lang]/account">) {
  const { dict } = await getI18n();
  const a = dict.account;
  return (
    <>
      <PageHeader
        title={a.title}
        icon={<UserRound className="size-8 text-primary" />}
        description={a.description}
        crumbs={[{ href: "/account", label: a.title }]}
      />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
          <Account searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Account({
  searchParams,
}: {
  searchParams: PageProps<"/[lang]/account">["searchParams"];
}) {
  const { dict, href } = await getI18n();
  const a = dict.account;
  const params = await searchParams;
  if (!isDbConfigured()) return <p className="text-lg">{a.unavailable}</p>;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex flex-col gap-6">
        {params.verwijderd ? <Notice>{a.deleted}</Notice> : null}
        {params.email ? <Notice>{a.emailChanged}</Notice> : null}
        <div className="grid gap-6 md:grid-cols-2">
          <Section title={a.loginTitle}>
            <LoginForm />
          </Section>
          <Section title={a.registerTitle}>
            <p className="text-muted-foreground">{a.registerPitch}</p>
            <ul className="list-disc pl-5 text-muted-foreground">
              {a.registerBenefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <Link
              href={href("/account/registreren")}
              className={buttonVariants({
                size: "lg",
                className: "h-11 w-fit px-6 font-bold",
              })}
            >
              {a.registerCta}
            </Link>
          </Section>
        </div>
      </div>
    );
  }
  return (
    <Dashboard
      user={user}
      notice={params.welkom ? a.welcome : params.email ? a.emailChanged : null}
    />
  );
}

async function Dashboard({
  user,
  notice,
}: {
  user: CurrentUser;
  notice: string | null;
}) {
  const { lang, dict, href, fmt } = await getI18n();
  const a = dict.account;
  const [watchlist, alerts, newsletter] = await Promise.all([
    getWatchlist(user.id),
    getAlerts(user.email, lang),
    getNewsletter(user.email),
  ]);
  return (
    <div className="flex flex-col gap-6">
      {notice ? <Notice>{notice}</Notice> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
        <p className="text-lg">
          {a.loggedInAs} <span className="font-bold">{user.email}</span>
        </p>
        <LogoutButton />
      </div>

      <Section
        title={a.watchlistTitle}
        icon={<Heart className="size-5 text-primary" />}
      >
        <p className="text-muted-foreground">
          {watchlist.length === 0
            ? a.watchlistEmpty
            : watchlist.length === 1
              ? a.watchlistOne
              : t(a.watchlistCount, { count: fmt.number(watchlist.length) })}
        </p>
        <Link
          href={href("/volglijst")}
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className: "h-11 w-fit font-bold",
          })}
        >
          {a.watchlistOpen}
        </Link>
      </Section>

      <Section
        title={a.alertsTitle}
        icon={<BellRing className="size-5 text-primary" />}
      >
        <p className="text-muted-foreground">{a.alertsHint}</p>
        <AlertList alerts={alerts} />
      </Section>

      <Section
        title={a.newsletterTitle}
        icon={<Mail className="size-5 text-primary" />}
      >
        <p className="text-muted-foreground">{a.newsletterHint}</p>
        <NewsletterSwitch subscribed={newsletter.subscribed} />
        {newsletter.token ? (
          <div className="border-t pt-6">
            <PreferencesForm
              key={newsletter.token}
              token={newsletter.token}
              initial={newsletter.prefs}
              action={saveNewsletterPreferences}
            />
          </div>
        ) : null}
      </Section>

      <Section
        title={a.emailTitle}
        icon={<AtSign className="size-5 text-primary" />}
      >
        <p className="text-muted-foreground">{a.emailHint}</p>
        <div className="max-w-md">
          <ChangeEmailForm />
        </div>
      </Section>

      <Section
        title={a.passwordTitle}
        icon={<KeyRound className="size-5 text-primary" />}
      >
        <div className="max-w-md">
          <ChangePasswordForm />
        </div>
      </Section>

      <Section
        title={a.deleteTitle}
        icon={<Trash2 className="size-5 text-destructive" />}
      >
        <p className="text-muted-foreground">{a.deleteText}</p>
        <div className="max-w-md">
          <DeleteAccountForm />
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <h2 className="flex items-center gap-2 text-xl font-black">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="p-4">
      <AlertDescription className="text-base">{children}</AlertDescription>
    </Alert>
  );
}
