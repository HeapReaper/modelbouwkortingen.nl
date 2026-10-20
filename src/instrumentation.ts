/**
 * Planner: roept elke paar minuten de eigen routes aan voor
 *   - /api/nieuwsbrief/verzenden: de dagelijkse kortingsmail. Die bepaalt zelf of het tijd is en
 *     verstuurt hooguit één keer per dag (slot in de database);
 *   - /api/discord/verzenden: nieuwe deals naar de Discord-webhooks (eigen cursor per abonnee);
 *   - /api/prijsalarm/controleren: prijsalarmen waarvan de doelprijs bereikt is (claim per alarm);
 *   - /api/crawler/controleren: crawl-rondes die opvallend weinig producten zagen (één melding
 *     per ronde, primary key op run_id);
 *   - /api/vertalen/bijwerken: namen van nieuwe deals van Duitse en Franse webshops vertalen (een
 *     dubbele vertaling overschrijft alleen dezelfde rij).
 * Meerdere servers of herstarts zijn dus geen probleem.
 *
 * Bewust een HTTP-aanroep en geen directe import: deze code draait buiten de
 * React Server-omgeving, waar onze server-only modules (database, mail) niet geladen mogen
 * worden. Uitzetten met NEWSLETTER_SCHEDULER=off (bv. als je een externe cron gebruikt).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NEWSLETTER_SCHEDULER === "off") return;

  // Zonder ingesteld token: een willekeurig token dat alleen dit serverproces kent.
  process.env.NEWSLETTER_CRON_TOKEN ||= crypto.randomUUID();
  const base = `http://127.0.0.1:${process.env.PORT ?? 3000}`;

  const call = async (path: string) => {
    try {
      const res = await fetch(base + path, {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.NEWSLETTER_CRON_TOKEN}`,
        },
        signal: AbortSignal.timeout(30 * 60_000),
      });
      if (!res.ok) console.error(`[planner] ${path} gaf HTTP ${res.status}`);
    } catch (err) {
      console.error(`[planner] ${path} niet bereikbaar`, err);
    }
  };
  const tick = () =>
    Promise.all([
      call("/api/nieuwsbrief/verzenden"),
      call("/api/discord/verzenden"),
      call("/api/prijsalarm/controleren"),
      call("/api/crawler/controleren"),
      call("/api/vertalen/bijwerken"),
    ]);
  setTimeout(tick, 60_000).unref();
  setInterval(tick, 5 * 60_000).unref();
}
