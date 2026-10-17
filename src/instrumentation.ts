/**
 * Planner voor de dagelijkse kortingsmail: roept elke paar minuten de eigen route
 * /api/nieuwsbrief/verzenden aan. Die bepaalt zelf of het tijd is en verstuurt hooguit één
 * keer per dag (slot in de database), dus meerdere servers of herstarts zijn geen probleem.
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
  const url = `http://127.0.0.1:${process.env.PORT ?? 3000}/api/nieuwsbrief/verzenden`;

  const tick = async () => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.NEWSLETTER_CRON_TOKEN}`,
        },
        signal: AbortSignal.timeout(30 * 60_000),
      });
      if (!res.ok)
        console.error(`[nieuwsbrief] planner kreeg HTTP ${res.status}`);
    } catch (err) {
      console.error("[nieuwsbrief] planner kon de server niet bereiken", err);
    }
  };
  setTimeout(tick, 60_000).unref();
  setInterval(tick, 5 * 60_000).unref();
}
