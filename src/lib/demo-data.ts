import type { Deal, PricePoint } from "@/lib/deals";
import { getShop } from "@/lib/shops";

// Voorbeelddata die getoond wordt zolang er geen DATABASE_URL is ingesteld,
// zodat de site er tijdens het ontwikkelen niet leeg uitziet.
const RAW: [string, string, string, string, number, number][] = [
  // [naam, merk, shop, categorie, prijs, oude prijs]
  [
    "Arrma Talion 6S 1/7 EXB 4X4 RTR Speed Truck",
    "Arrma",
    "toemen",
    "rc-autos",
    749,
    849,
  ],
  [
    "Traxxas Maxx 1/10 4WD Brushless Monster Truck RTR",
    "Traxxas",
    "toprc",
    "rc-autos",
    559,
    649,
  ],
  [
    "Team Corally Syncro-4 1/8 4WD Buggy 4S RTR",
    "Team Corally",
    "wetronic",
    "rc-autos",
    359,
    399,
  ],
  [
    "Losi 1/10 RZR Rey 4WD Brushless RTR - Polaris",
    "Losi",
    "toprc",
    "rc-autos",
    599,
    689,
  ],
  ["HPI Vorza Nitro Truggy 1/8 4WD RTR", "HPI", "toemen", "rc-autos", 399, 699],
  [
    "FMS 1/24 Chevrolet K5 Blazer FCX24 Crawler RTR",
    "FMS",
    "toprc",
    "rc-autos",
    149,
    179.95,
  ],
  [
    "Element RC Enduro Trailrunner 4X4 RTR",
    "Element RC",
    "toprc",
    "rc-autos",
    419,
    439,
  ],
  [
    "E-flite P-47 Razorback 1.2m PNP",
    "E-flite",
    "toprc",
    "vliegtuigen",
    289.99,
    349.99,
  ],
  [
    "Multiplex EasyGlider 4 RR zweefvliegtuig",
    "Multiplex",
    "wetronic",
    "vliegtuigen",
    219,
    259,
  ],
  [
    "Volantex Ranger 2000 FPV PNP",
    "Volantex",
    "toprc",
    "vliegtuigen",
    189,
    229,
  ],
  [
    "OMPHobby M4 3D Helicopter BNF",
    "OMPHobby",
    "toemen",
    "helicopters",
    449,
    529,
  ],
  [
    "Blade Nano S3 RTF Helicopter",
    "Blade",
    "toprc",
    "helicopters",
    119,
    149.99,
  ],
  ["DJI Mini 3 Pro Drone (zonder accu)", "DJI", "toemen", "drones", 449, 699],
  ["DJI Avata 2 Fly More Combo", "DJI", "toemen", "drones", 899, 1049],
  ["BetaFPV Cetus X FPV Kit", "BetaFPV", "toprc", "drones", 179, 209],
  [
    "Pro Boat Blackjack 24 Catamaran RTR",
    "Pro Boat",
    "toprc",
    "boten",
    239,
    279,
  ],
  [
    "Joysway Dragon Force 65 V7 zeilboot RTR",
    "Joysway",
    "wetronic",
    "boten",
    199,
    229,
  ],
  [
    "Tamiya Scania S770 V8 SLT Zwaartransport 1/14",
    "Tamiya",
    "wetronic",
    "werkvoertuigen",
    649,
    849,
  ],
  [
    "Tamiya Mercedes Actros 3363 Gigaspace 1/14",
    "Tamiya",
    "wetronic",
    "werkvoertuigen",
    459,
    509,
  ],
  [
    "Huina 1580 RC graafmachine 1/14 23-kanaals",
    "Huina",
    "toemen",
    "werkvoertuigen",
    159,
    199,
  ],
  [
    "Heng Long Leopard 2A6 1/16 RC tank IR",
    "Heng Long",
    "toemen",
    "tanks",
    249,
    289,
  ],
  [
    "Spektrum NX20 20-kanaals zender",
    "Spektrum",
    "toprc",
    "zenders",
    1099,
    1449,
  ],
  [
    "Spektrum DX5 Pro DSMR zender met SR2100",
    "Spektrum",
    "toemen",
    "zenders",
    189,
    449,
  ],
  [
    "FrSky Taranis X9D Plus SE 2019 zender",
    "FrSky",
    "wetronic",
    "zenders",
    199,
    239,
  ],
  [
    "Hobbywing Ezrun MAX5 HV G2 ESC + motor combo",
    "Hobbywing",
    "toprc",
    "elektronica",
    389.95,
    429,
  ],
  [
    "Savöx SB-2290SG Monster Brushless servo",
    "Savöx",
    "wetronic",
    "elektronica",
    119,
    139,
  ],
  [
    "SkyRC eFuel 50A (1200W) voeding",
    "SkyRC",
    "toprc",
    "accus-laders",
    319.95,
    351.99,
  ],
  [
    "Gens Ace 5000mAh 4S 60C LiPo (2 stuks)",
    "Gens Ace",
    "toemen",
    "accus-laders",
    89.95,
    109.95,
  ],
  ["ISDT Q8 Max 1000W lader", "ISDT", "wetronic", "accus-laders", 139, 169],
  [
    "Arrma 4X4 Transmission Upgrade Set",
    "Arrma",
    "toprc",
    "onderdelen",
    39.99,
    64.99,
  ],
  [
    "Pro-Line Badlands MX43 Pro-Loc banden (2)",
    "Pro-Line",
    "toemen",
    "onderdelen",
    69.95,
    84.95,
  ],
  [
    "Traxxas aluminium schokdempers set (4)",
    "Traxxas",
    "toprc",
    "onderdelen",
    79,
    99,
  ],
  [
    "Hudy Ultimate inbus-set 1.5/2.0/2.5/3.0mm",
    "Hudy",
    "wetronic",
    "gereedschap",
    54,
    64,
  ],
  [
    "Tamiya Polycarbonate spray PS-1 wit",
    "Tamiya",
    "toemen",
    "gereedschap",
    6.5,
    12.5,
  ],
  [
    "Pocher 1/8 Lamborghini Aventador bouwpakket",
    "Pocher",
    "toemen",
    "overig",
    449,
    549,
  ],
  [
    "OcCre HMS Victory 1/87 houten scheepsmodel",
    "OcCre",
    "toemen",
    "overig",
    299,
    349,
  ],
];

let cache: Deal[] | null = null;

export function demoDeals(): Deal[] {
  if (cache) return cache.map((d) => ({ ...d }));
  const now = Date.now();
  cache = RAW.map(
    ([name, brand, shopSlug, categorySlug, price, oldPrice], i) => {
      const discountAmount = Math.round((oldPrice - price) * 100) / 100;
      const shop = getShop(shopSlug);
      return {
        id: i + 1,
        name,
        brand,
        imageUrl: null,
        url: shop?.url ?? "#",
        price,
        oldPrice,
        referencePrice: oldPrice,
        discountAmount,
        discountPercent: Math.round((discountAmount / oldPrice) * 10000) / 100,
        inStock: i % 7 !== 3,
        dealSince: new Date(now - ((i * 7) % 30) * 3_600_000 * 5).toISOString(),
        categorySlug,
        shopCategory: null,
        shopSlug,
        shopName: shop?.name ?? shopSlug,
      };
    },
  );
  return demoDeals();
}

export function demoHistory(id: number): PricePoint[] {
  const deal = demoDeals().find((d) => d.id === id);
  if (!deal?.oldPrice) return [];
  const day = 86_400_000;
  const now = Date.now();
  return [
    {
      date: new Date(now - 40 * day).toISOString(),
      price: deal.oldPrice,
      oldPrice: null,
    },
    {
      date: new Date(now - 21 * day).toISOString(),
      price: deal.oldPrice * 0.97,
      oldPrice: null,
    },
    {
      date: new Date(now - 12 * day).toISOString(),
      price: deal.oldPrice,
      oldPrice: null,
    },
    {
      date: new Date(now - 3 * day).toISOString(),
      price: deal.price,
      oldPrice: deal.oldPrice,
    },
  ].map((p) => ({ ...p, price: Math.round(p.price * 100) / 100 }));
}
