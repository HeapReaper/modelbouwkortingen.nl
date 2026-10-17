import { BadgeEuro, Radar, ShoppingCart } from "lucide-react";
import { getI18n } from "@/i18n/server";

const ICONS = [Radar, BadgeEuro, ShoppingCart];

export async function HowItWorks() {
  const { dict } = await getI18n();
  return (
    <section className="mx-auto w-full max-w-7xl px-4">
      <div className="rounded-3xl bg-foreground p-6 text-background sm:p-10">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
          {dict.home.howTitle}
        </h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {dict.home.howSteps.map((s, i) => {
            const Icon = ICONS[i];
            return (
              <li key={s.title} className="flex flex-col gap-3">
                <span className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-full bg-deal font-heading text-xl font-black text-deal-foreground">
                    {i + 1}
                  </span>
                  <Icon className="size-7 text-deal" />
                </span>
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="text-background/80">{s.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
