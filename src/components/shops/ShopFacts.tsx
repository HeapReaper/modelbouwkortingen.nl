import { Info } from "lucide-react";
import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { rich, t } from "@/i18n/translate";
import { vatNote } from "@/lib/format";
import { getShopStats } from "@/lib/shop-stats";
import { type ShopInfo, shopVat } from "@/lib/shops";

/**
 * Eigen cijfers en gegevens over een webshop (assortiment, kortingen, prijsverlagingen,
 * verzendkosten), boven de deals op de webshoppagina. Zonder database alleen de vaste gegevens.
 */
export async function ShopFacts({ shop }: { shop: ShopInfo }) {
  const { dict, href, fmt } = await getI18n();
  const s = dict.shopPage;
  const stats = await getShopStats(shop.slug);
  const pct = (n: number) => `${fmt.number(n)}%`;

  const tiles = stats
    ? [
        { label: s.statProducts, value: fmt.number(stats.products) },
        { label: s.statDeals, value: fmt.number(stats.deals) },
        {
          label: s.statAvg,
          value: stats.deals > 0 ? pct(stats.avgDiscount) : "—",
          hint:
            stats.deals > 0
              ? t(s.statAvgHint, { max: pct(stats.maxDiscount) })
              : undefined,
        },
        {
          label: s.statDrops,
          value: fmt.number(
            Math.round((stats.priceDrops / stats.dropDays) * 7),
          ),
          hint: t(s.statDropsHint, {
            count: fmt.number(stats.priceDrops),
            days: fmt.number(stats.dropDays),
          }),
        },
        {
          label: s.statChecked,
          value: fmt.number(stats.checked24h),
          hint: stats.lastChecked
            ? t(s.statCheckedHint, {
                ago: fmt.timeAgo(stats.lastChecked) ?? "",
              })
            : undefined,
        },
        {
          label: s.statStock,
          value: fmt.number(stats.inStock),
          hint:
            stats.products > 0
              ? t(s.statStockHint, {
                  percent: pct(
                    Math.round((stats.inStock / stats.products) * 100),
                  ),
                })
              : undefined,
        },
      ]
    : [];

  // Alleen tonen als de webshop zijn verzendkosten zelf noemt (zie ShopInfo.shipping).
  const shipping = shop.shipping
    ? shop.shipping.cost === 0
      ? s.shippingFree
      : shop.shipping.freeFrom !== undefined
        ? t(s.shippingFreeFrom, {
            cost: fmt.euro(shop.shipping.cost),
            free: fmt.euro(shop.shipping.freeFrom, { round: true }),
          })
        : fmt.euro(shop.shipping.cost)
    : null;

  const vat = vatNote(shopVat(shop.slug), dict.vat, fmt);

  const details = [
    {
      label: s.country,
      value: shop.country ? fmt.country(shop.country) : s.countryUnknown,
    },
    ...(vat ? [{ label: dict.vat.label, value: vat }] : []),
    ...(shipping ? [{ label: s.shipping, value: shipping }] : []),
    {
      label: s.language,
      value: shop.language
        ? t(s.languageTranslated, { language: fmt.language(shop.language) })
        : s.languageDefault,
    },
    ...(stats
      ? [
          {
            label: s.trackedSince,
            value: fmt.longDate(new Date(stats.trackedSince)),
          },
        ]
      : []),
    {
      label: s.affiliate,
      value: shop.affiliate ? s.affiliateText : s.affiliateNone,
    },
  ];

  return (
    <section className="mb-10 flex flex-col gap-6 rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="text-2xl font-black">
        {t(s.factsTitle, { name: shop.name })}
      </h2>
      {stats ? (
        <p className="max-w-3xl text-base text-muted-foreground">
          {t(stats.deals > 0 ? s.summary : s.summaryNoDeals, {
            name: shop.name,
            count: fmt.number(stats.products),
            deals: fmt.number(stats.deals),
            avg: pct(stats.avgDiscount),
          })}
        </p>
      ) : null}
      {tiles.length > 0 ? (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="flex flex-col gap-1 rounded-xl bg-accent p-4"
            >
              <dt className="text-sm font-semibold text-muted-foreground">
                {tile.label}
              </dt>
              <dd className="font-heading text-2xl font-black tabular-nums">
                {tile.value}
              </dd>
              {tile.hint ? (
                <dd className="text-sm text-muted-foreground">{tile.hint}</dd>
              ) : null}
            </div>
          ))}
        </dl>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <dl className="flex flex-col divide-y">
          {details.map((d) => (
            <div
              key={d.label}
              className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4"
            >
              <dt className="shrink-0 font-semibold sm:w-56">{d.label}</dt>
              <dd className="text-muted-foreground">{d.value}</dd>
            </div>
          ))}
        </dl>
        {stats && stats.categories.length > 0 ? (
          <div className="flex flex-col gap-3">
            <h3 className="font-bold">{s.categoriesTitle}</h3>
            <ul className="flex flex-col gap-2">
              {stats.categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={href(`/webshops/${shop.slug}?categorie=${c.slug}`)}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 rounded-lg border px-3 py-2 hover:border-primary"
                  >
                    <span className="font-semibold">
                      {dict.categories[c.slug]?.name ?? c.slug}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t(s.categoryCount, {
                        products: fmt.number(c.products),
                        deals: fmt.number(c.deals),
                      })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          {rich(s.method, {
            link: (
              <Link
                href={href("/over#korting")}
                className="font-semibold text-primary underline"
              >
                {s.methodLink}
              </Link>
            ),
          })}
        </span>
      </p>
    </section>
  );
}
