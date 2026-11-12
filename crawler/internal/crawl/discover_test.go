package crawl

import (
	"context"
	"errors"
	"log/slog"
	"testing"
	"time"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/config"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/shops"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// flakyShop laat Discover de eerste `fails` keer mislukken.
type flakyShop struct {
	shops.Shop
	fails, calls int
}

func (s *flakyShop) Discover(context.Context, *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	s.calls++
	if s.calls <= s.fails {
		return nil, nil, errors.New("HTTP 502")
	}
	return []string{"https://shop.example/c"}, nil, nil
}

func TestDiscoverRetry(t *testing.T) {
	cfg := &config.Config{DiscoveryRetry: time.Millisecond}
	r := NewRunner(cfg, nil, nil, nil, slog.New(slog.DiscardHandler))

	shop := &flakyShop{fails: 1}
	listings, _, err := r.discover(context.Background(), &shopRun{shop: shop, log: r.log})
	if err != nil || len(listings) != 1 || shop.calls != 2 {
		t.Errorf("één storing: err=%v listings=%d calls=%d, want nil/1/2", err, len(listings), shop.calls)
	}

	shop = &flakyShop{fails: 5}
	if _, _, err = r.discover(context.Background(), &shopRun{shop: shop, log: r.log}); err == nil || shop.calls != 2 {
		t.Errorf("blijvende storing: err=%v calls=%d, want fout na 2 pogingen", err, shop.calls)
	}

	cfg.DiscoveryRetry = 0
	shop = &flakyShop{fails: 1}
	if _, _, err = r.discover(context.Background(), &shopRun{shop: shop, log: r.log}); err == nil || shop.calls != 1 {
		t.Errorf("retry uit: err=%v calls=%d, want fout na 1 poging", err, shop.calls)
	}
}
