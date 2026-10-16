import { BadgeEuro, Radar, ShoppingCart } from "lucide-react";

const STEPS = [
  {
    icon: Radar,
    title: "Wij scannen de webshops",
    text: "Onze crawler bezoekt elke dag duizenden productpagina's van TopRC, Toemen, Wetronic en meer.",
  },
  {
    icon: BadgeEuro,
    title: "Alleen échte kortingen",
    text: "Een product komt pas op de site als het minstens €5 of 5% goedkoper is dan de normale prijs.",
  },
  {
    icon: ShoppingCart,
    title: "Jij bestelt direct bij de shop",
    text: "Klik door naar de webshop en bestel zoals altijd. Wij rekenen niets extra's.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4">
      <div className="rounded-3xl bg-foreground p-6 text-background sm:p-10">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
          Hoe werkt Modelbouwkortingen?
        </h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3">
              <span className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-deal font-heading text-xl font-black text-deal-foreground">
                  {i + 1}
                </span>
                <s.icon className="size-7 text-deal" />
              </span>
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="text-background/80">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
