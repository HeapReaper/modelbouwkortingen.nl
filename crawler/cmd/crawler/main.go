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
	"syscall"
	"time"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/config"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/crawl"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/fetch"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/shops"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/stats"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/store"
)

func main() {
	var handler slog.Handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})
	if os.Getenv("LOG_FORMAT") == "json" {
		handler = slog.NewJSONHandler(os.Stdout, nil)
	}
	log := slog.New(handler)

	cfg, err := config.Load()
	if err != nil {
		log.Error("configuratie", "err", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	reg := stats.New()
	if cfg.HTTPAddr != "" {
		srv := &http.Server{Addr: cfg.HTTPAddr, Handler: reg.Handler(cfg.StatsToken), ReadHeaderTimeout: 5 * time.Second}
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

	list := shops.BySlug(cfg.Shops)
	if len(list) == 0 {
		log.Error("geen (geldige) shops geselecteerd", "shops", cfg.Shops)
		os.Exit(1)
	}
	runner := crawl.NewRunner(cfg, fetcher, st, reg, log)

	for {
		started := time.Now()
		runner.RunAll(ctx, list)
		if cfg.RunOnce || ctx.Err() != nil {
			break
		}
		wait := cfg.Interval - time.Since(started)
		if wait < time.Minute {
			wait = time.Minute
		}
		log.Info("wachten tot de volgende ronde", "over", wait.Round(time.Second))
		select {
		case <-ctx.Done():
		case <-time.After(wait):
		}
		if ctx.Err() != nil {
			break
		}
	}
	log.Info("crawler gestopt")
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
