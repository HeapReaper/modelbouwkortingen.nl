import { notFound } from "next/navigation";

/**
 * Onbekende URL's binnen een taal: zonder deze catch-all toont Next zijn eigen kale 404
 * (zonder layout, want het root-layout hangt onder [lang]); zo krijgt de bezoeker
 * src/app/[lang]/not-found.tsx in de eigen taal.
 */
// Deze route geeft altijd een 404; er valt niets te valideren voor directe navigatie.
export const instant = false;

export default function CatchAll() {
  notFound();
}
