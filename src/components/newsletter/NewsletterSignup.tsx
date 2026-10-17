import { MailOpen } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { getI18n } from "@/i18n/server";

/** Aanmeldblok voor de dagelijkse kortingsmail (homepage en /nieuwsbrief). */
export async function NewsletterSignup() {
  const { dict } = await getI18n();
  return (
    <section className="mx-auto w-full max-w-7xl px-4">
      <div className="grid gap-6 rounded-3xl border-4 border-foreground bg-deal p-6 text-deal-foreground shadow-[8px_8px_0_0_var(--foreground)] sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="flex flex-col gap-3">
          <MailOpen className="size-10" />
          <h2 className="text-2xl font-black tracking-tight text-balance sm:text-3xl">
            {dict.newsletter.signupTitle}
          </h2>
          <p className="text-lg text-deal-foreground/80">
            {dict.newsletter.signupText}
          </p>
        </div>
        <NewsletterForm />
      </div>
    </section>
  );
}
