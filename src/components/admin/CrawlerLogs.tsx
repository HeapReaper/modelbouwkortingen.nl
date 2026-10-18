"use client";

import { Pause, Play, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fetchCrawlerLogs } from "@/app/[lang]/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import type { CrawlerLogEntry, CrawlerLogFilter } from "@/lib/admin";
import { cn } from "@/lib/utils";

/** Zo vaak nieuwe regels ophalen. */
const POLL_MS = 3000;
/** Zoveel regels houden we in beeld; oudere vallen eraf. */
const MAX_LINES = 1000;

const LEVELS: { value: CrawlerLogFilter["level"]; label: string }[] = [
  { value: "DEBUG", label: "Alles (ook debug)" },
  { value: "INFO", label: "Info en hoger" },
  { value: "WARN", label: "Waarschuwingen en fouten" },
  { value: "ERROR", label: "Alleen fouten" },
];

const LEVEL_CLASS: Record<CrawlerLogEntry["level"], string> = {
  DEBUG: "text-muted-foreground",
  INFO: "text-sky-600 dark:text-sky-400",
  WARN: "text-amber-600 dark:text-amber-400",
  ERROR: "text-destructive",
};

const time = new Intl.DateTimeFormat("nl-NL", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Europe/Amsterdam",
});

/**
 * Live logvenster van de crawler: haalt elke paar seconden de nieuwe regels op (alleen die na
 * de laatst geziene, via `after`). Een ander filter begint opnieuw met de laatste 500.
 */
export function CrawlerLogs({ shops }: { shops: string[] }) {
  const [level, setLevel] = useState<CrawlerLogFilter["level"]>("INFO");
  const [shop, setShop] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [products, setProducts] = useState(false);
  const [paused, setPaused] = useState(false);
  const [entries, setEntries] = useState<CrawlerLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  const box = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  // Zoeken pas na even niet typen.
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    latest.current = 0;
    setEntries([]);
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      if (pausedRef.current) {
        timer = setTimeout(poll, POLL_MS);
        return;
      }
      const res = await fetchCrawlerLogs({
        level,
        shop,
        q,
        products,
        after: latest.current,
      }).catch((err: unknown) => ({
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      }));
      if (stopped) return;
      if (res.ok) {
        setError(null);
        // Na een herstart van de crawler begint de teller opnieuw.
        const restarted = res.latest < latest.current;
        latest.current = res.latest;
        setEntries((old) =>
          (restarted ? res.entries : [...old, ...res.entries]).slice(
            -MAX_LINES,
          ),
        );
      } else {
        setError(res.error);
      }
      timer = setTimeout(poll, POLL_MS);
    };
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [level, shop, q, products]);

  // Meescrollen zolang je onderaan staat.
  useEffect(() => {
    // Alleen om na nieuwe regels opnieuw te scrollen.
    void entries;
    const el = box.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          aria-label="Niveau"
          value={level}
          onChange={(e) =>
            setLevel(e.target.value as CrawlerLogFilter["level"])
          }
        >
          {LEVELS.map((l) => (
            <NativeSelectOption key={l.value} value={l.value}>
              {l.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Shop"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
        >
          <NativeSelectOption value="">Alle shops</NativeSelectOption>
          {shops.map((s) => (
            <NativeSelectOption key={s} value={s}>
              {s}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoeken (bv. 429, url, foutmelding)"
          aria-label="Zoeken in de logs"
          className="h-8 w-full sm:w-64"
        />
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Switch
            id="log-products"
            checked={products}
            onCheckedChange={setProducts}
          />
          <label htmlFor="log-products">Productregels</label>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? <Play /> : <Pause />} {paused ? "Hervatten" : "Pauzeren"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEntries([])}>
            <Trash2 /> Leegmaken
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div
        ref={box}
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        }}
        className="h-[32rem] overflow-auto rounded-xl border bg-muted/40 p-3 font-mono text-xs leading-relaxed"
      >
        {entries.length === 0 ? (
          <p className="text-muted-foreground">
            {error
              ? "Geen logs."
              : "Nog geen regels die bij dit filter passen."}
          </p>
        ) : (
          entries.map((e) => (
            <div key={e.seq} className="break-all whitespace-pre-wrap">
              <span className="text-muted-foreground">
                {time.format(new Date(e.time))}
              </span>{" "}
              <span className={cn("font-bold", LEVEL_CLASS[e.level])}>
                {e.level.padEnd(5)}
              </span>{" "}
              {e.shop ? (
                <span className="font-semibold text-primary">[{e.shop}] </span>
              ) : null}
              <span className="text-foreground">{e.msg}</span>
              {e.attrs
                ? Object.entries(e.attrs).map(([k, v]) => (
                    <span key={k} className="text-muted-foreground">
                      {" "}
                      {k}=<span className="text-foreground/80">{v}</span>
                    </span>
                  ))
                : null}
            </div>
          ))
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        De crawler bewaart de laatste 5.000 regels en apart de laatste 1.000
        waarschuwingen en fouten, tot hij herstart. Debugregels alleen met{" "}
        <code>LOG_LEVEL=debug</code> op de crawler. Alles staat ook in de
        container-logs in Coolify.
      </p>
    </div>
  );
}
