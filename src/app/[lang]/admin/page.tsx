import {
  Activity,
  AlertTriangle,
  BellRing,
  Database,
  Gauge,
  Mail,
  MousePointerClick,
  Package,
  Phone,
  PlugZap,
  ScrollText,
  Share2,
  Tag,
} from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import {
  MessageHandledButton,
  ShopEnabledSwitch,
} from "@/components/admin/AdminButtons";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import {
  PhoneNumbersAdmin,
  SocialLinksAdmin,
} from "@/components/admin/ContactAdmin";
import { CrawlerLogs } from "@/components/admin/CrawlerLogs";
import { DailyChart } from "@/components/admin/DailyChart";
import { RecheckButton, TestMailForm } from "@/components/admin/ServiceAdmin";
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
import { formatDateTime, formatNumber, timeAgo } from "@/lib/format";
import {
  getServiceStatus,
  type ServiceCheck,
  type ServiceState,
  type ServiceStatus,
} from "@/lib/service-status";
import { getSiteContact } from "@/lib/site-contact";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60_000;

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
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}
      >
        <AdminContent />
      </Suspense>
    </div>
  );
}

async function AdminContent() {
  const [data, live, contact, status] = await Promise.all([
    getAdminOverview(),
    getCrawlerLive(),
    getSiteContact(),
    getServiceStatus(),
  ]);
  const totalDeals = data.shops.reduce((s, x) => s + x.deals, 0);
  const totalProducts = data.shops.reduce((s, x) => s + x.products, 0);

  return (
    <>
      {!data.db.ok ? (
        <Notice tone="warn">Database: {data.db.error}</Notice>
      ) : null}
      {data.crawlAlerts
        .filter(
          (a) => Date.now() - new Date(a.startedAt).getTime() < 2 * DAY_MS,
        )
        .map((a) => (
          <Notice key={a.runId} tone="warn">
            Crawler: <strong>{a.shop}</strong> zag in ronde #{a.runId} (
            {formatDateTime(a.startedAt)}) maar {formatNumber(a.seen)}{" "}
            producten, normaal ±{formatNumber(a.baseline)}. Werkt de parser nog?
          </Notice>
        ))}

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
      </div>

      <ServicesSection status={status} live={live} />
      <CrawlerSection live={live} />
      <Section
        title="Crawler-logs (live)"
        icon={<ScrollText className="size-5 text-primary" />}
      >
        <CrawlerLogs shops={data.shops.map((s) => s.slug).sort()} />
      </Section>
      <ShopsSection data={data} />

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

const SOURCE_LABELS: Record<string, string> = {
  site: "Website",
  mail: "Kortingsmail",
  discord: "Discord",
  alarm: "Prijsalarm",
  feed: "RSS-feed",
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
                <MessageHandledButton id={m.id} handled={m.handled} />
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
  children,
}: {
  tone: "warn";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border p-4",
        tone === "warn" && "border-deal bg-accent text-accent-foreground",
      )}
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0" />
      <p>{children}</p>
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
