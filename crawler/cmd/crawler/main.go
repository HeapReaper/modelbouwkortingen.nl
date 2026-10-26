// Command crawler crawlt RC-webshops en zet producten met korting in de database
// van modelbouwkortingen.nl.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"slices"
	"sync/atomic"
	"syscall"
	"time"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/config"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/crawl"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/logbuf"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/shops"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/stats"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/store"
)

func main() {
	level := slog.LevelInfo
	if os.Getenv("LOG_LEVEL") == "debug" {
		level = slog.LevelDebug
	}
	var handler slog.Handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: level})
	if os.Getenv("LOG_FORMAT") == "json" {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})
	}
	// De laatste regels ook in het geheugen, voor het admin panel (GET /logs).
	logs := logbuf.New(5000, 1000)
	log := slog.New(logs.Handler(handler))

	cfg, err := config.Load()
	if err != nil {
		log.Error("configuratie", "err", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	list := shops.BySlug(cfg.Shops)
	if len(list) == 0 {
		log.Error("geen (geldige) shops geselecteerd", "shops", cfg.Shops)
		os.Exit(1)
	}

	reg := stats.New()
	// De server start al vóór de database (voor /healthz); de runner komt pas daarna.
	var runner atomic.Pointer[crawl.Runner]
	if cfg.HTTPAddr != "" {
		run := runHandler(ctx, list, &runner)
		srv := &http.Server{Addr: cfg.HTTPAddr, Handler: reg.Handler(cfg.StatsToken, logs, run), ReadHeaderTimeout: 5 * time.Second}
		go func() {
			log.Info("stats server luistert", "addr", cfg.HTTPAddr)
			if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
				log.Error("stats server", "err", err)
			}
		}()
		defer srv.Shutdown(context.Background()) //nolint:errcheck
	}

	var st *store.Store
	if !cfg.DryRun {
		st, err = openStore(ctx, cfg.DatabaseURL, log)
		if err != nil {
			log.Error("database", "err", err)
			os.Exit(1)
		}
		defer st.Close()
		log.Info("database klaar")
	} else {
		log.Warn("dry-run: er wordt niets naar de database geschreven")
	}

	fetcher := fetch.New(fetch.Options{
		UserAgent:  cfg.UserAgent,
		HostDelay:  cfg.HostDelay,
		Timeout:    cfg.RequestTimeout,
		MaxRetries: cfg.MaxRetries,
		Backoff429: cfg.Backoff429,
		MaxBackoff: cfg.MaxBackoff,
	}, reg, log)

	runner.Store(crawl.NewRunner(cfg, fetcher, st, reg, log))

	runner.Load().Schedule(ctx, list, cfg.Interval, cfg.RunOnce)
	log.Info("crawler gestopt")
}

// runHandler: POST /run?shop=<slug> start meteen een ronde voor die shop (admin panel).
// 202 = gestart, 409 = er loopt al een ronde, 404 = onbekende of niet geselecteerde shop.
func runHandler(ctx context.Context, list []shops.Shop, runner *atomic.Pointer[crawl.Runner]) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		slug := req.URL.Query().Get("shop")
		idx := slices.IndexFunc(list, func(s shops.Shop) bool { return s.Slug() == slug })
		r := runner.Load()
		switch {
		case idx < 0:
			http.Error(w, "onbekende shop", http.StatusNotFound)
		case r == nil:
			http.Error(w, "crawler start nog op", http.StatusServiceUnavailable)
		case !r.Start(ctx, list[idx]):
			http.Error(w, crawl.ErrBusy.Error(), http.StatusConflict)
		default:
			w.WriteHeader(http.StatusAccepted)
		}
	})
}

// openStore probeert een tijdje opnieuw, zodat de crawler kan starten voordat Postgres klaar is.
func openStore(ctx context.Context, dsn string, log *slog.Logger) (*store.Store, error) {
	var lastErr error
	for attempt := range 30 {
		st, err := store.Open(ctx, dsn)
		if err == nil {
			return st, nil
		}
		lastErr = err
		log.Warn("database nog niet bereikbaar, opnieuw proberen", "poging", attempt+1, "err", err)
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(2 * time.Second):
		}
	}
	return nil, lastErr
}
