import {
  Activity,
  AlertTriangle,
  BellRing,
  Construction,
  Database,
  Eye,
  Gauge,
  Mail,
  Megaphone,
  MousePointerClick,
  Package,
  Phone,
  PlugZap,
  ScrollText,
  Share2,
  Tag,
} from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  CrawlNowButton,
  DeleteMessageButton,
  MessageHandledButton,
  ResolveAlertButton,
  ShopCategoriesButton,
  ShopEnabledSwitch,
} from "@/components/admin/AdminButtons";
import { AnalyticsChart } from "@/components/admin/AnalyticsChart";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import {
  PhoneNumbersAdmin,
  SocialLinksAdmin,
} from "@/components/admin/ContactAdmin";
import { CrawlerLogs } from "@/components/admin/CrawlerLogs";
import { DailyChart } from "@/components/admin/DailyChart";
import { MaintenanceAdmin } from "@/components/admin/MaintenanceAdmin";
import { PromotionsAdmin } from "@/components/admin/PromotionsAdmin";
import { RecheckButton, TestMailForm } from "@/components/admin/ServiceAdmin";
import { AnalyticsOptOut } from "@/components/analytics/AnalyticsOptOut";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDictionary } from "@/i18n/dictionaries";
import {
  type AdminOverview,
  type CrawlerLive,
  getAdminOverview,
  getCrawlerLive,
} from "@/lib/admin";
import { type Analytics, getAnalytics } from "@/lib/analytics";
import { isDbConfigured } from "@/lib/db";
import { formatDateTime, formatNumber, timeAgo } from "@/lib/format";
import { getMaintenance } from "@/lib/maintenance";
import { listPromotions, todayNL } from "@/lib/promotions";
import {
  getServiceStatus,
  type ServiceCheck,
  type ServiceState,
  type ServiceStatus,
} from "@/lib/service-status";
import { getSiteContact } from "@/lib/site-contact";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Admin panel</h1>
          <p className="text-muted-foreground">
            Crawler, database en berichten in één overzicht.
          </p>
        </div>
        <AutoRefresh />
      </div>
      <AnalyticsOptOut />
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}
      >
        <AdminContent />
      </Suspense>
    </div>
  );
}

async function AdminContent() {
  const [data, live, contact, status, promotions, analytics, maintenance] =
    await Promise.all([
      getAdminOverview(),
      getCrawlerLive(),
      getSiteContact(),
      getServiceStatus(),
      loadPromotions(),
      getAnalytics(),
      getMaintenance(),
    ]);
  const totalDeals = data.shops.reduce((s, x) => s + x.deals, 0);
  const totalProducts = data.shops.reduce((s, x) => s + x.products, 0);

  return (
    <>
      {!data.db.ok ? (
        <Notice tone="warn">Database: {data.db.error}</Notice>
      ) : null}
      {maintenance.enabled ? (
        <Notice tone="warn">
          <strong>Onderhoudsmodus staat aan:</strong> bezoekers zien de
          onderhoudspagina.
        </Notice>
      ) : null}
      {data.crawlAlerts.map((a) => (
        <Notice
          key={a.runId}
          tone="warn"
          action={<ResolveAlertButton runId={a.runId} />}
        >
          Crawler: <strong>{a.shop}</strong> zag in ronde #{a.runId} (
          {formatDateTime(a.startedAt)}) maar {formatNumber(a.seen)} producten,
          normaal ±{formatNumber(a.baseline)}
          {a.status === "failed" ? " (ronde mislukt)" : ""}. Werkt de parser
          nog?
        </Notice>
      ))}
      {data.crawlAlerts.length > 1 ? (
        <div className="flex justify-end">
          <ResolveAlertButton />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Tag} label="Deals live" value={formatNumber(totalDeals)} />
        <Kpi
          icon={Package}
          label="Producten gevolgd"
          value={formatNumber(totalProducts)}
        />
        <Kpi
          icon={Database}
          label="Database"
          value={
            data.db.sizeBytes
              ? `${(data.db.sizeBytes / 1024 / 1024).toFixed(1)} MB`
              : "—"
          }
          sub={
            data.db.priceHistoryRows !== undefined
              ? `${formatNumber(data.db.priceHistoryRows)} prijspunten`
              : undefined
          }
        />
        <Kpi
          icon={Mail}
          label="Open berichten"
          value={formatNumber(data.unhandledMessages)}
        />
        <Kpi
          icon={Activity}
          label="Crawler"
          value={live.ok ? "Online" : "Offline"}
          sub={live.ok ? `uptime ${live.uptime}` : undefined}
          tone={live.ok ? "good" : "bad"}
        />
        <Kpi
          icon={MousePointerClick}
          label="Kliks naar shops (7d)"
          value={formatNumber(data.clicks.last7)}
          sub={`${formatNumber(data.clicks.last30)} in 30 dagen`}
        />
        <Kpi
          icon={BellRing}
          label="Prijsalarmen actief"
          value={formatNumber(data.priceAlerts.active)}
          sub={`${formatNumber(data.priceAlerts.unconfirmed)} onbevestigd · ${formatNumber(data.priceAlerts.sent30)} verstuurd (30d)`}
        />
        <Kpi
          icon={Eye}
          label="Bezoekers vandaag"
          value={analytics ? formatNumber(analytics.today.visitors) : "—"}
          sub={
            analytics
              ? `${formatNumber(analytics.today.views)} paginaweergaven · ${formatNumber(analytics.activeNow)} nu actief`
              : undefined
          }
        />
      </div>

      {analytics ? <AnalyticsSection a={analytics} /> : null}

      <ServicesSection status={status} live={live} />
      {isDbConfigured() ? (
        <Section
          title="Onderhoudsmodus"
          icon={<Construction className="size-5 text-primary" />}
        >
          <MaintenanceAdmin
            key={`${maintenance.enabled}-${maintenance.message}`}
            enabled={maintenance.enabled}
            message={maintenance.message}
          />
        </Section>
      ) : null}
      <CrawlerSection live={live} />
      <Section
        title="Crawler-logs (live)"
        icon={<ScrollText className="size-5 text-primary" />}
      >
        <CrawlerLogs shops={data.shops.map((s) => s.slug).sort()} />
      </Section>
      <ShopsSection data={data} />
      {promotions ? (
        <Section
          title="Uitgelicht (betaalde plaatsingen)"
          icon={<Megaphone className="size-5 text-primary" />}
        >
          <PromotionsAdmin
            promotions={promotions}
            shops={data.shops
              .map((s) => ({ slug: s.slug, name: s.name }))
              .sort((a, b) => a.name.localeCompare(b.name))}
            today={todayNL()}
          />
        </Section>
      ) : null}

      {contact ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <Section title="Telefoonnummers" icon={<Phone className="size-5" />}>
            <PhoneNumbersAdmin phones={contact.phones} />
          </Section>
          <Section title="Social media" icon={<Share2 className="size-5" />}>
            <SocialLinksAdmin socials={contact.socials} />
          </Section>
        </div>
      ) : null}

      <Section title="Afgelopen 14 dagen">
        {data.daily.length > 0 ? (
          <DailyChart data={data.daily} />
        ) : (
          <Empty>Nog geen data.</Empty>
        )}
      </Section>

      <RunsSection data={data} />
      <ClicksSection data={data} />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <Section title="Categorieën">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categorie</TableHead>
                <TableHead className="text-right">Deals</TableHead>
                <TableHead className="text-right">Producten</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.categories.map((c) => (
                <TableRow key={c.slug}>
                  <TableCell>
                    {getDictionary("nl").categories[c.slug]?.name ?? c.slug}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(c.deals)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(c.products)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
        <MessagesSection data={data} />
      </div>
    </>
  );
}

/** null zonder (bereikbare) database: dan valt er niets te beheren. */
async function loadPromotions() {
  await connection();
  if (!isDbConfigured()) return null;
  try {
    return await listPromotions();
  } catch (err) {
    console.error("[admin] promoties laden mislukt", err);
    return null;
  }
}

const SERVICE_BADGE: Record<
  ServiceState,
  { label: string; variant: "secondary" | "destructive" | "outline" }
> = {
  ok: { label: "werkt", variant: "secondary" },
  down: { label: "storing", variant: "destructive" },
  off: { label: "uit", variant: "outline" },
};

const SERVICE_DOT: Record<ServiceState, string> = {
  ok: "bg-savings",
  down: "bg-destructive",
  off: "bg-muted-foreground/40",
};

function ServicesSection({
  status,
  live,
}: {
  status: ServiceStatus;
  live: CrawlerLive;
}) {
  // De crawler wordt bij elke verversing opnieuw bevraagd (zie getCrawlerLive()).
  const crawler: ServiceCheck = live.ok
    ? {
        key: "crawler",
        name: "Crawler",
        state: "ok",
        detail: `Online, uptime ${live.uptime}`,
      }
    : process.env.CRAWLER_STATS_URL
      ? {
          key: "crawler",
          name: "Crawler",
          state: "down",
          detail: live.error ?? "Niet bereikbaar",
        }
      : {
          key: "crawler",
          name: "Crawler",
          state: "off",
          detail: live.error ?? "Niet ingesteld",
        };
  const services = [...status.services, crawler];
  const smtp = services.find((s) => s.key === "smtp");
  return (
    <Section
      title="Diensten"
      icon={<PlugZap className="size-5 text-primary" />}
    >
      <div className="flex flex-col gap-6">
        <ul className="divide-y rounded-xl border">
          {services.map((s) => (
            <li
              key={s.key}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"
            >
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  SERVICE_DOT[s.state],
                )}
                aria-hidden
              />
              <span className="min-w-48 font-semibold">{s.name}</span>
              <span className="min-w-0 flex-1 basis-60 text-sm break-words text-muted-foreground">
                {s.detail}
              </span>
              {s.ms !== undefined ? (
                <span className="text-sm text-muted-foreground tabular-nums">
                  {formatNumber(s.ms)} ms
                </span>
              ) : null}
              <Badge variant={SERVICE_BADGE[s.state].variant}>
                {SERVICE_BADGE[s.state].label}
              </Badge>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Gecontroleerd {timeAgo(status.checkedAt)} (
            {formatDateTime(status.checkedAt)}); wordt 5 minuten onthouden.
          </p>
          <RecheckButton />
        </div>
        <TestMailForm disabled={smtp?.state === "off"} />
      </div>
    </Section>
  );
}

function CrawlerSection({ live }: { live: CrawlerLive }) {
  return (
    <Section
      title="Crawler (live)"
      icon={<Gauge className="size-5 text-primary" />}
    >
      {!live.ok ? (
        <Notice tone="warn">
          {live.error}. Zet <code>CRAWLER_STATS_URL</code> (bv.{" "}
          <code>http://crawler:8080/stats</code>) om live statistieken te zien.
        </Notice>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-3 md:grid-cols-3">
            {(live.shops ?? []).map((s) => {
              const pct =
                s.queueTotal > 0
                  ? Math.round((s.queueDone / s.queueTotal) * 100)
                  : 0;
              return (
                <div key={s.shop} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{s.shop}</p>
                    <Badge
                      variant={s.phase === "idle" ? "secondary" : "default"}
                    >
                      {s.phase}
                    </Badge>
                  </div>
                  {s.phase !== "idle" ? (
                    <div className="mt-3 flex flex-col gap-1">
                      <Progress value={pct} />
                      <p className="text-sm text-muted-foreground tabular-nums">
                        {formatNumber(s.queueDone)} /{" "}
                        {formatNumber(s.queueTotal)} ({pct}%)
                      </p>
                    </div>
                  ) : null}
                  <dl className="mt-3 grid grid-cols-2 gap-1 text-sm">
                    <dt className="text-muted-foreground">Producten</dt>
                    <dd className="text-right tabular-nums">
                      {formatNumber(s.productsSeen)}
                    </dd>
                    <dt className="text-muted-foreground">Deals</dt>
                    <dd className="text-right tabular-nums">
                      {formatNumber(s.dealsFound)}
                    </dd>
                    <dt className="text-muted-foreground">Parse-fouten</dt>
                    <dd className="text-right tabular-nums">
                      {formatNumber(s.parseErrors)}
                    </dd>
                    <dt className="text-muted-foreground">Sitemap-URL's</dt>
                    <dd className="text-right tabular-nums">
                      {formatNumber(s.sitemapUrls)}
                    </dd>
                    <dt className="text-muted-foreground">Laatste ronde</dt>
                    <dd className="text-right">
                      {s.lastRunAt
                        ? `${timeAgo(s.lastRunAt)} (${s.lastRunStatus})`
                        : "—"}
                    </dd>
                  </dl>
                  <CrawlNowButton shop={s.shop} running={s.phase !== "idle"} />
                </div>
              );
            })}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Host</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">OK</TableHead>
                  <TableHead className="text-right">429</TableHead>
                  <TableHead className="text-right">Fouten</TableHead>
                  <TableHead className="text-right">404</TableHead>
                  <TableHead className="text-right">Robots</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead>Backoff</TableHead>
                  <TableHead>Laatste</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(live.hosts ?? []).map((h) => (
                  <TableRow key={h.host}>
                    <TableCell className="font-semibold">{h.host}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(h.requests)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(h.ok)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        h.rateLimited > 0 && "font-bold text-primary",
                      )}
                    >
                      {formatNumber(h.rateLimited)}
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums"
                      title={h.lastError}
                    >
                      {formatNumber(h.errors)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(h.notFound)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(h.robotsBlocked)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {h.avgLatencyMs} ms
                    </TableCell>
                    <TableCell>
                      {h.backoff ? (
                        <Badge variant="destructive">{h.backoff}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {h.lastStatus || "—"}{" "}
                      {h.lastRequestAt ? `· ${timeAgo(h.lastRequestAt)}` : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Section>
  );
}

function ShopsSection({ data }: { data: AdminOverview }) {
  return (
    <Section title="Webshops">
      {data.shops.length === 0 ? (
        <Empty>
          Nog geen shops in de database. Start de crawler om ze aan te maken.
        </Empty>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead className="text-right">Producten</TableHead>
                <TableHead className="text-right">Deals</TableHead>
                <TableHead className="text-right">Gem. korting</TableHead>
                <TableHead className="text-right">
                  Productpagina's 24u
                </TableHead>
                <TableHead>Laatst gezien</TableHead>
                <TableHead>Tonen</TableHead>
                <TableHead>Categorieën</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.shops.map((s) => (
                <TableRow key={s.slug}>
                  <TableCell className="font-semibold">{s.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(s.products)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(s.deals)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.avgDiscount ? `${s.avgDiscount}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(s.crawledLast24h)}
                  </TableCell>
                  <TableCell>{timeAgo(s.lastSeen) ?? "—"}</TableCell>
                  <TableCell>
                    <ShopEnabledSwitch slug={s.slug} enabled={s.enabled} />
                  </TableCell>
                  <TableCell>
                    <ShopCategoriesButton
                      slug={s.slug}
                      name={s.name}
                      categories={s.categories.map((c) => ({
                        ...c,
                        name:
                          getDictionary("nl").categories[c.slug]?.name ??
                          c.slug,
                      }))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Section>
  );
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ok: "secondary",
  running: "default",
  failed: "destructive",
  aborted: "outline",
};

function RunsSection({ data }: { data: AdminOverview }) {
  return (
    <Section title="Laatste crawl-rondes">
      {data.runs.length === 0 ? (
        <Empty>Nog geen crawl-rondes.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gestart</TableHead>
                <TableHead>Duur</TableHead>
                <TableHead className="text-right">Pagina's</TableHead>
                <TableHead className="text-right">Producten</TableHead>
                <TableHead className="text-right">Deals</TableHead>
                <TableHead className="text-right">Fouten</TableHead>
                <TableHead className="text-right">429</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold">{r.shop}</TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[r.status] ?? "outline"}
                      title={r.message ?? undefined}
                    >
                      {r.status}
                    </Badge>
                    {r.status === "failed" && r.message ? (
                      <p className="mt-1 max-w-72 text-xs break-words text-destructive">
                        {r.message}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(r.startedAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {duration(r.startedAt, r.finishedAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.pagesFetched)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.productsSeen)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.dealsFound)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.errors)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(r.rateLimited)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Section>
  );
}

const LANG_LABELS: Record<string, string> = {
  nl: "Nederlands",
  en: "Engels",
  de: "Duits",
  fr: "Frans",
  es: "Spaans",
};

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobiel",
  tablet: "Tablet",
};

function AnalyticsSection({ a }: { a: Analytics }) {
  const visits = a.referrers.reduce((n, r) => n + r.visits, 0);
  const share = (n: number, total: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}%` : "—";
  return (
    <Section title="Bezoekers" icon={<Eye className="size-5 text-primary" />}>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {(
            [
              ["Vandaag", a.today],
              ["Gisteren", a.yesterday],
              ["7 dagen", a.last7],
              ["30 dagen", a.last30],
            ] as const
          ).map(([label, t]) => (
            <div key={label} className="rounded-xl border p-3">
              <p className="text-sm font-semibold text-muted-foreground">
                {label}
              </p>
              <p className="font-heading text-xl font-black tabular-nums">
                {formatNumber(t.views)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatNumber(t.visitors)} bezoekers
              </p>
            </div>
          ))}
          <div className="rounded-xl border p-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Nu actief
            </p>
            <p className="font-heading text-xl font-black tabular-nums text-savings">
              {formatNumber(a.activeNow)}
            </p>
            <p className="text-sm text-muted-foreground">laatste 5 minuten</p>
          </div>
        </div>

        <AnalyticsChart daily={a.daily} weekly={a.weekly} monthly={a.monthly} />

        {a.last30.views === 0 ? (
          <Empty>Nog geen bezoeken in de afgelopen 30 dagen.</Empty>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="overflow-x-auto">
              <h3 className="mb-2 font-bold">Meest bekeken pagina's</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pagina</TableHead>
                    <TableHead className="text-right">Vandaag</TableHead>
                    <TableHead className="text-right">7 dagen</TableHead>
                    <TableHead className="text-right">30 dagen</TableHead>
                    <TableHead className="text-right">Bezoekers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {a.topPages.map((p) => (
                    <TableRow key={p.path}>
                      <TableCell className="max-w-80">
                        <a
                          href={p.path}
                          className="line-clamp-1 font-semibold hover:underline"
                          title={p.path}
                        >
                          {p.title ?? p.path}
                        </a>
                        {p.title ? (
                          <span className="text-sm text-muted-foreground">
                            {p.path}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(p.today)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(p.last7)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(p.last30)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(p.visitors)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="mb-2 font-bold">Herkomst (30 dagen)</h3>
                <ul className="divide-y rounded-xl border">
                  {a.referrers.map((r) => (
                    <li
                      key={r.referrer ?? ""}
                      className="flex items-baseline justify-between gap-3 px-3 py-2"
                    >
                      <span className="min-w-0 truncate">
                        {r.referrer ?? (
                          <span className="text-muted-foreground">
                            Direct / onbekend
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatNumber(r.visits)}{" "}
                        <span className="text-sm text-muted-foreground">
                          {share(r.visits, visits)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-bold">Taal en apparaat (30 dagen)</h3>
                <p className="flex flex-wrap gap-2 text-sm">
                  {a.langs.map((l) => (
                    <Badge key={l.lang} variant="secondary">
                      {LANG_LABELS[l.lang] ?? l.lang}:{" "}
                      {share(l.views, a.last30.views)}
                    </Badge>
                  ))}
                </p>
                <p className="mt-2 flex flex-wrap gap-2 text-sm">
                  {a.devices.map((d) => (
                    <Badge key={d.device} variant="outline">
                      {DEVICE_LABELS[d.device] ?? d.device}:{" "}
                      {share(d.views, a.last30.views)}
                    </Badge>
                  ))}
                </p>
              </div>
            </div>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Zonder bots en zonder cookies. Bezoekers zijn per dag uniek (week en
          maand tellen de dagen op). Je eigen bezoeken vanaf dit apparaat tellen
          niet mee sinds je het admin panel opende.
        </p>
      </div>
    </Section>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  site: "Website",
  mail: "Kortingsmail",
  discord: "Discord",
  alarm: "Prijsalarm",
  feed: "RSS-feed",
  featured: "Uitgelicht",
};

function ClicksSection({ data }: { data: AdminOverview }) {
  const c = data.clicks;
  return (
    <Section
      title="Kliks naar webshops"
      icon={<MousePointerClick className="size-5 text-primary" />}
    >
      {c.last30 === 0 ? (
        <Empty>Nog geen kliks in de afgelopen 30 dagen.</Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead className="text-right">7 dagen</TableHead>
                  <TableHead className="text-right">30 dagen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {c.byShop.map((s) => (
                  <TableRow key={s.slug}>
                    <TableCell className="font-semibold">{s.name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(s.last7)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(s.last30)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 flex flex-wrap gap-2 text-sm">
              {c.bySource.map((s) => (
                <Badge key={s.source} variant="secondary">
                  {SOURCE_LABELS[s.source] ?? s.source}:{" "}
                  {formatNumber(s.clicks)}
                </Badge>
              ))}
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-bold">Meest geklikt (30 dagen)</h3>
            <ol className="flex flex-col gap-2">
              {c.topProducts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-baseline justify-between gap-3 rounded-lg border p-2"
                >
                  <span className="min-w-0">
                    <a
                      href={`/product/${p.id}`}
                      className="line-clamp-1 font-semibold hover:underline"
                    >
                      {p.name}
                    </a>
                    <span className="text-sm text-muted-foreground">
                      {p.shop}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums">
                    {formatNumber(p.clicks)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Section>
  );
}

function MessagesSection({ data }: { data: AdminOverview }) {
  return (
    <Section
      title="Contactberichten"
      icon={<Mail className="size-5 text-primary" />}
    >
      {data.messages.length === 0 ? (
        <Empty>Nog geen berichten.</Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.messages.map((m) => (
            <li
              key={m.id}
              className={cn("rounded-xl border p-4", m.handled && "opacity-60")}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">
                    {m.subject}{" "}
                    {!m.handled ? <Badge className="ml-1">nieuw</Badge> : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {m.name} ·{" "}
                    <a href={`mailto:${m.email}`} className="underline">
                      {m.email}
                    </a>{" "}
                    · {formatDateTime(m.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <MessageHandledButton id={m.id} handled={m.handled} />
                  <DeleteMessageButton id={m.id} subject={m.subject} />
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function duration(start: string, end: string | null) {
  const ms =
    (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return `${Math.round(ms / 1000)}s`;
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}u ${min % 60}m`;
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="size-4" /> {label}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-2xl font-black tabular-nums",
          tone === "good" && "text-savings",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </p>
      {sub ? <p className="text-sm text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function Notice({
  tone,
  action,
  children,
}: {
  tone: "warn";
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-2 rounded-xl border p-4",
        tone === "warn" && "border-deal bg-accent text-accent-foreground",
      )}
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0" />
      <p className="min-w-0 flex-1">{children}</p>
      {action}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
      {children}
    </p>
  );
}
