// Package crawl orkestreert crawl-rondes: alle shops parallel, per shop meerdere workers.
package crawl

import (
	"context"
	"errors"
	"fmt"
	"html"
	"log/slog"
	"math"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/categorize"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/config"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/shops"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/stats"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/store"
)

const maxListingPagesPerSeed = 50

type Runner struct {
	cfg     *config.Config
	fetcher *fetch.Fetcher
	store   *store.Store // nil in dry-run modus
	stats   *stats.Registry
	log     *slog.Logger
}

func NewRunner(cfg *config.Config, f *fetch.Fetcher, st *store.Store, reg *stats.Registry, log *slog.Logger) *Runner {
	return &Runner{cfg: cfg, fetcher: f, store: st, stats: reg, log: log}
}

// RunAll crawlt alle shops tegelijk en wacht tot ze klaar zijn.
func (r *Runner) RunAll(ctx context.Context, list []shops.Shop) {
	var wg sync.WaitGroup
	for _, s := range list {
		wg.Go(func() {
			if err := r.RunShop(ctx, s); err != nil && ctx.Err() == nil {
				r.log.Error("crawl mislukt", "shop", s.Slug(), "err", err)
			}
		})
	}
	wg.Wait()
}

// shopRun houdt de tellers van één ronde voor één shop bij.
type shopRun struct {
	shop   shops.Shop
	shopID int
	runID  int64
	log    *slog.Logger

	host            string
	rateLimitedBase int64
	reg             *stats.Registry

	pages, products, deals, errs, parseErrs atomic.Int64
}

func (sr *shopRun) result(status, msg string) store.RunResult {
	return store.RunResult{
		Status: status, PagesFetched: sr.pages.Load(), ProductsSeen: sr.products.Load(),
		DealsFound: sr.deals.Load(), Errors: sr.errs.Load(), RateLimited: sr.reg.RateLimited(sr.host) - sr.rateLimitedBase, Message: msg,
	}
}

func (r *Runner) RunShop(ctx context.Context, shop shops.Shop) (err error) {
	start := time.Now()
	sr := &shopRun{shop: shop, log: r.log.With("shop", shop.Slug()), reg: r.stats}
	if u, e := url.Parse(shop.BaseURL()); e == nil {
		sr.host = u.Host
		sr.rateLimitedBase = r.stats.RateLimited(sr.host)
		if hp, ok := shop.(shops.HostPolicy); ok {
			r.fetcher.SetHostPolicy(sr.host, hp.UserAgent(), hp.MinDelay())
		}
	}
	r.stats.UpdateShop(shop.Slug(), func(s *stats.ShopStats) {
		*s = stats.ShopStats{Shop: shop.Slug(), Phase: "sitemap", RunStartedAt: start, LastRunAt: s.LastRunAt, LastRunStatus: s.LastRunStatus}
	})

	if r.store != nil {
		if sr.shopID, err = r.store.EnsureShop(ctx, shop.Slug(), shop.Name(), shop.BaseURL(), shop.Description()); err != nil {
			return err
		}
		if sr.runID, err = r.store.StartRun(ctx, sr.shopID); err != nil {
			return err
		}
		r.stats.UpdateShop(shop.Slug(), func(s *stats.ShopStats) { s.RunID = sr.runID })
	}

	// Tussentijds de voortgang naar de database schrijven voor het admin panel.
	progressCtx, stopProgress := context.WithCancel(ctx)
	defer stopProgress()
	if r.store != nil {
		go func() {
			t := time.NewTicker(30 * time.Second)
			defer t.Stop()
			for {
				select {
				case <-progressCtx.Done():
					return
				case <-t.C:
					_ = r.store.UpdateRun(progressCtx, sr.runID, sr.result("running", ""), false)
				}
			}
		}()
	}

	defer func() {
		status, msg := "ok", ""
		switch {
		case ctx.Err() != nil:
			status, msg = "aborted", "crawler gestopt"
		case err != nil:
			status, msg = "failed", err.Error()
		}
		if r.store != nil {
			if n, e := r.store.ExpireStale(context.Background(), sr.shopID, start.Add(-r.cfg.StaleAfter)); e == nil && n > 0 {
				sr.log.Info("verlopen deals uitgezet", "aantal", n)
			}
			_ = r.store.PruneMisses(context.Background(), sr.shopID, start.Add(-4*r.cfg.MissRecrawlAfter))
			_ = r.store.UpdateRun(context.Background(), sr.runID, sr.result(status, msg), true)
		}
		r.stats.UpdateShop(shop.Slug(), func(s *stats.ShopStats) {
			s.Phase, s.LastRunAt, s.LastRunStatus = "idle", time.Now(), status
		})
		sr.log.Info("crawl-ronde klaar", "status", status, "duur", time.Since(start).Round(time.Second),
			"paginas", sr.pages.Load(), "producten", sr.products.Load(), "deals", sr.deals.Load(), "fouten", sr.errs.Load())
	}()

	sr.log.Info("crawl-ronde gestart")
	listings, products, err := shop.Discover(ctx, r.fetcher)
	if err != nil {
		return fmt.Errorf("sitemap/discovery: %w", err)
	}
	r.stats.UpdateShop(shop.Slug(), func(s *stats.ShopStats) { s.SitemapURLs = int64(len(products)) })
	sr.log.Info("discovery klaar", "listings", len(listings), "productpaginas", len(products))

	// 1. Listingpagina's: snel veel prijzen (incl. "van"-prijzen) ophalen.
	if r.cfg.MaxListingPages > 0 && len(listings) > r.cfg.MaxListingPages {
		listings = listings[:r.cfg.MaxListingPages]
	}
	r.setPhase(shop, "listings", len(listings))
	r.work(ctx, listings, func(ctx context.Context, u string) { r.crawlListing(ctx, sr, u) })
	if ctx.Err() != nil {
		return ctx.Err()
	}

	// 2. Productpagina's: details, breadcrumbs en actuele prijs.
	queue, err := r.productQueue(ctx, sr, products)
	if err != nil {
		return err
	}
	r.setPhase(shop, "products", len(queue))
	r.work(ctx, queue, func(ctx context.Context, u string) { r.crawlProduct(ctx, sr, u) })
	r.setPhase(shop, "finishing", 0)
	return ctx.Err()
}

// productQueue bepaalt welke productpagina's deze ronde bezocht worden:
// eerst bestaande deals (om ze actueel te houden), dan nooit bezochte pagina's
// (nieuwste eerst volgens de sitemap), dan de pagina's die het langst geleden bezocht zijn.
func (r *Runner) productQueue(ctx context.Context, sr *shopRun, products []sitemap.URL) ([]string, error) {
	states := map[string]store.CrawlState{}
	if r.store != nil {
		var err error
		if states, err = r.store.CrawlStates(ctx, sr.shopID); err != nil {
			return nil, err
		}
	}
	cutoff := time.Now().Add(-r.cfg.RecrawlAfter)
	// Onbekende pagina's zonder product (dood, of buiten de categorieën) veel langer overslaan.
	// Een bekend product dat even niet te parsen was komt na RecrawlAfter gewoon terug.
	missCutoff := time.Now().Add(-r.cfg.MissRecrawlAfter)
	type item struct {
		url     string
		lastmod time.Time
		state   store.CrawlState
	}
	seen := map[string]bool{}
	var items []item
	skipped := 0
	for _, p := range products {
		if seen[p.Loc] {
			continue
		}
		seen[p.Loc] = true
		st, ok := states[p.Loc]
		if !ok {
			// Sommige sitemaps zijn dubbel ge-escaped ("Bind&amp;Fly"); het product staat onder
			// de canonieke URL ("Bind&Fly") en kreeg anders nooit een crawl-status (Heligear).
			st = states[html.UnescapeString(p.Loc)]
		}
		if st.CrawledAt.After(cutoff) || (st.Miss && !st.Known && st.CrawledAt.After(missCutoff)) {
			skipped++
			continue
		}
		items = append(items, item{p.Loc, p.LastMod, st})
	}
	rank := func(it item) int {
		switch {
		case it.state.IsDeal:
			return 0
		case it.state.CrawledAt.IsZero():
			return 1
		default:
			return 2
		}
	}
	sort.SliceStable(items, func(i, j int) bool {
		a, b := items[i], items[j]
		if ra, rb := rank(a), rank(b); ra != rb {
			return ra < rb
		}
		if rank(a) == 2 {
			return a.state.CrawledAt.Before(b.state.CrawledAt)
		}
		return a.lastmod.After(b.lastmod)
	})
	limit := r.cfg.MaxProductPages
	if l, ok := sr.shop.(shops.ProductPageLimiter); ok && (limit == 0 || l.MaxProductPages() < limit) {
		limit = l.MaxProductPages()
	}
	if limit > 0 && len(items) > limit {
		items = items[:limit]
	}
	out := make([]string, len(items))
	for i, it := range items {
		out[i] = it.url
	}
	sr.log.Info("productpagina's in de wachtrij", "aantal", len(out), "overgeslagen_recent", skipped)
	return out, nil
}

func (r *Runner) setPhase(shop shops.Shop, phase string, total int) {
	r.stats.UpdateShop(shop.Slug(), func(s *stats.ShopStats) {
		s.Phase, s.QueueTotal, s.QueueDone = phase, int64(total), 0
	})
}

// work verdeelt URL's over WorkersPerShop goroutines.
func (r *Runner) work(ctx context.Context, urls []string, fn func(context.Context, string)) {
	jobs := make(chan string)
	var wg sync.WaitGroup
	for range r.cfg.WorkersPerShop {
		wg.Go(func() {
			for u := range jobs {
				fn(ctx, u)
			}
		})
	}
feed:
	for _, u := range urls {
		select {
		case <-ctx.Done():
			break feed
		case jobs <- u:
		}
	}
	close(jobs)
	wg.Wait()
}

func (r *Runner) getRaw(ctx context.Context, sr *shopRun, u string) (*fetch.Response, error) {
	resp, err := r.fetcher.Get(ctx, u)
	if err != nil {
		if !errors.Is(err, fetch.ErrNotFound) && !errors.Is(err, fetch.ErrRobots) && ctx.Err() == nil {
			sr.errs.Add(1)
			sr.log.Warn("ophalen mislukt", "url", u, "err", err)
		}
		return nil, err
	}
	sr.pages.Add(1)
	return resp, nil
}

func (r *Runner) get(ctx context.Context, sr *shopRun, u string) (*goquery.Document, string, error) {
	resp, err := r.getRaw(ctx, sr, u)
	if err != nil {
		return nil, "", err
	}
	doc, err := parse.Document(resp.Body, resp.Header.Get("Content-Type"))
	if err != nil {
		sr.errs.Add(1)
		return nil, "", err
	}
	return doc, resp.URL, nil
}

func (r *Runner) crawlListing(ctx context.Context, sr *shopRun, seed string) {
	defer r.stats.UpdateShop(sr.shop.Slug(), func(s *stats.ShopStats) { s.QueueDone++ })
	u := seed
	for page := 0; u != "" && page < maxListingPagesPerSeed && ctx.Err() == nil; page++ {
		var products []parse.Product
		var next string
		if raw, ok := sr.shop.(shops.RawListingParser); ok {
			resp, err := r.getRaw(ctx, sr, u)
			if err != nil {
				return
			}
			products, next = raw.ParseListingRaw(resp.URL, resp.Body)
		} else {
			doc, finalURL, err := r.get(ctx, sr, u)
			if err != nil {
				return
			}
			products, next = sr.shop.ParseListing(finalURL, doc)
		}
		for _, p := range products {
			p.URL = parse.AbsURL(sr.shop.BaseURL(), p.URL)
			r.save(ctx, sr, p, false)
		}
		if len(products) == 0 {
			return
		}
		u = next
	}
}

func (r *Runner) crawlProduct(ctx context.Context, sr *shopRun, u string) {
	defer r.stats.UpdateShop(sr.shop.Slug(), func(s *stats.ShopStats) { s.QueueDone++ })
	doc, finalURL, err := r.get(ctx, sr, u)
	if errors.Is(err, fetch.ErrNotFound) && r.store != nil {
		_ = r.store.MarkGone(ctx, sr.shopID, u)
		_ = r.store.RecordMiss(ctx, sr.shopID, u)
	}
	if err != nil {
		return
	}
	p := sr.shop.ParseProduct(finalURL, doc)
	if p == nil {
		// Onder de URL uit de wachtrij, zodat productQueue hem volgende ronde herkent.
		if r.store != nil {
			_ = r.store.RecordMiss(ctx, sr.shopID, u)
		}
		sr.log.Debug("geen product gevonden op pagina", "url", finalURL)
		sr.parseErrs.Add(1)
		r.stats.UpdateShop(sr.shop.Slug(), func(s *stats.ShopStats) { s.ParseErrors++ })
		return
	}
	p.URL = parse.AbsURL(sr.shop.BaseURL(), p.URL)
	p.ImageURL = parse.AbsURL(sr.shop.BaseURL(), p.ImageURL)
	r.save(ctx, sr, *p, true)
}

func (r *Runner) save(ctx context.Context, sr *shopRun, p parse.Product, fromProductPage bool) {
	if isUsed(p) {
		return
	}
	p.ImageURL = parse.AbsURL(sr.shop.BaseURL(), p.ImageURL)
	category := categorize.Classify(p.Breadcrumbs, p.CategoryHint, p.URL, p.Name)
	sr.products.Add(1)
	r.stats.UpdateShop(sr.shop.Slug(), func(s *stats.ShopStats) { s.ProductsSeen++ })

	if r.store == nil {
		// Zonder database is er geen prijshistorie, dus ook geen deals; alleen loggen.
		sr.log.Info("product", "prijs", p.Price, "van", p.OldPrice, "categorie", category, "naam", p.Name)
		return
	}
	rules := store.DealRules{MinEUR: r.cfg.MinDiscountEUR, MinPercent: r.cfg.MinDiscountPercent}
	if pd, ok := sr.shop.(shops.PercentDeals); ok {
		rules = store.DealRules{MinEUR: math.Inf(1), MinPercent: max(rules.MinPercent, pd.MinDealPercent())}
	}
	res, err := r.store.UpsertProduct(ctx, sr.shopID, p, category, fromProductPage, rules)
	if err != nil {
		if ctx.Err() == nil {
			sr.errs.Add(1)
			sr.log.Warn("opslaan mislukt", "url", p.URL, "err", err)
		}
		return
	}
	if res.IsDeal {
		sr.deals.Add(1)
		r.stats.UpdateShop(sr.shop.Slug(), func(s *stats.ShopStats) { s.DealsFound++ })
	}
}

// usedRe herkent tweedehands/occasion-producten: hun "van"-prijs is de nieuwprijs,
// dus dat zijn geen echte kortingen.
var usedRe = regexp.MustCompile(`(?i)\b(occasions?|tweedehands|2e hands|gebruikt|in (een )?(nette|goede|prima) staat|donor|verkocht|demo-?model|b-keuze|refurbished|tweede kans)\b`)

func isUsed(p parse.Product) bool {
	return usedRe.MatchString(p.Name) || usedRe.MatchString(strings.Join(p.Breadcrumbs, " ")) ||
		usedRe.MatchString(p.CategoryHint) || strings.Contains(p.URL, "/tweedehands")
}
