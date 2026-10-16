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

export type Category = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
};

// Houd deze lijst gelijk met de `categories` tabel in crawler/migrations/001_init.sql.
export const CATEGORIES: Category[] = [
  {
    slug: "rc-autos",
    name: "RC Auto's",
    description: "Buggy's, monstertrucks, crawlers en drift cars",
    icon: Car,
  },
  {
    slug: "vliegtuigen",
    name: "Vliegtuigen",
    description: "Trainers, warbirds, jets en zweefvliegtuigen",
    icon: Plane,
  },
  {
    slug: "helicopters",
    name: "Helicopters",
    description: "Van beginners-heli tot 3D-machine",
    icon: Helicopter,
  },
  {
    slug: "drones",
    name: "Drones",
    description: "FPV, camera- en racedrones",
    icon: Drone,
  },
  {
    slug: "boten",
    name: "Boten",
    description: "Speedboten, zeilboten en schepen",
    icon: Sailboat,
  },
  {
    slug: "werkvoertuigen",
    name: "Werkvoertuigen",
    description: "Trucks, graafmachines, shovels en kranen",
    icon: Tractor,
  },
  {
    slug: "tanks",
    name: "Tanks & Militair",
    description: "RC tanks en militaire voertuigen",
    icon: Shield,
  },
  {
    slug: "zenders",
    name: "Zenders & Ontvangers",
    description: "Zenders, ontvangers en telemetrie",
    icon: RadioTower,
  },
  {
    slug: "elektronica",
    name: "Elektronica",
    description: "Servo's, regelaars, motoren en verlichting",
    icon: Cpu,
  },
  {
    slug: "accus-laders",
    name: "Accu's & Laders",
    description: "LiPo, NiMH, laders en voedingen",
    icon: BatteryCharging,
  },
  {
    slug: "onderdelen",
    name: "Onderdelen",
    description: "Banden, upgrades en reserveonderdelen",
    icon: Cog,
  },
  {
    slug: "gereedschap",
    name: "Gereedschap",
    description: "Gereedschap, lijm, verf en werkplaats",
    icon: Wrench,
  },
  {
    slug: "overig",
    name: "Overig",
    description: "Alles wat nergens anders past",
    icon: Package,
  },
];

const bySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(
  slug: string | null | undefined,
): Category | undefined {
  return slug ? bySlug.get(slug) : undefined;
}
