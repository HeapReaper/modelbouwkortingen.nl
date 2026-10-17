import {
  BatteryCharging,
  Car,
  Cog,
  Cpu,
  Drone,
  Helicopter,
  type LucideIcon,
  Package,
  Plane,
  RadioTower,
  Sailboat,
  Shield,
  Tractor,
  Wrench,
} from "lucide-react";

/** Naam en omschrijving staan per taal in de woordenboeken (dict.categories[slug]). */
export type Category = {
  slug: string;
  icon: LucideIcon;
};

// Houd deze lijst gelijk met de `categories` tabel in prisma/migrations/20261016000000_init/migration.sql
// en met dict.categories in src/i18n/dictionaries.
export const CATEGORIES: Category[] = [
  {
    slug: "rc-autos",
    icon: Car,
  },
  {
    slug: "vliegtuigen",
    icon: Plane,
  },
  {
    slug: "helicopters",
    icon: Helicopter,
  },
  {
    slug: "drones",
    icon: Drone,
  },
  {
    slug: "boten",
    icon: Sailboat,
  },
  {
    slug: "werkvoertuigen",
    icon: Tractor,
  },
  {
    slug: "tanks",
    icon: Shield,
  },
  {
    slug: "zenders",
    icon: RadioTower,
  },
  {
    slug: "elektronica",
    icon: Cpu,
  },
  {
    slug: "accus-laders",
    icon: BatteryCharging,
  },
  {
    slug: "onderdelen",
    icon: Cog,
  },
  {
    slug: "gereedschap",
    icon: Wrench,
  },
  {
    slug: "overig",
    icon: Package,
  },
];

const bySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(
  slug: string | null | undefined,
): Category | undefined {
  return slug ? bySlug.get(slug) : undefined;
}
