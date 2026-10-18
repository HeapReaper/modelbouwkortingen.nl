// Package store schrijft crawlresultaten naar PostgreSQL.
package store

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
)

type Store struct {
	pool *pgxpool.Pool
}

// DealRules bepaalt wanneer een product als "deal" op de site komt: als de prijs die wij
// zien minstens MinEUR of MinPercent onder de eerder door ons waargenomen prijs zakt.
type DealRules struct {
	MinEUR     float64
	MinPercent float64
}

func Open(ctx context.Context, dsn string) (*Store, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}
	if cfg.MaxConns < 8 {
		cfg.MaxConns = 8
	}
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("database niet bereikbaar: %w", err)
	}
	return &Store{pool: pool}, nil
}

func (s *Store) Close() { s.pool.Close() }

func (s *Store) EnsureShop(ctx context.Context, slug, name, baseURL, description string) (int, error) {
	var id int
	err := s.pool.QueryRow(ctx, `
		INSERT INTO shops (slug, name, base_url, description) VALUES ($1, $2, $3, $4)
		ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, base_url = EXCLUDED.base_url, description = EXCLUDED.description
		RETURNING id`, slug, name, baseURL, description).Scan(&id)
	return id, err
}

func (s *Store) StartRun(ctx context.Context, shopID int) (int64, error) {
	// Runs die nog op "running" staan zijn blijven hangen (crash/herstart).
	_, _ = s.pool.Exec(ctx, `UPDATE crawl_runs SET status='aborted', finished_at=now() WHERE shop_id=$1 AND status='running'`, shopID)
	var id int64
	err := s.pool.QueryRow(ctx, `INSERT INTO crawl_runs (shop_id) VALUES ($1) RETURNING id`, shopID).Scan(&id)
	return id, err
}

type RunResult struct {
	Status       string
	PagesFetched int64
	ProductsSeen int64
	DealsFound   int64
	Errors       int64
	RateLimited  int64
	Message      string
}

func (s *Store) UpdateRun(ctx context.Context, runID int64, r RunResult, finished bool) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE crawl_runs SET status=$2, pages_fetched=$3, products_seen=$4, deals_found=$5, errors=$6,
			rate_limited=$7, message=NULLIF($8, ''), finished_at = CASE WHEN $9 THEN now() ELSE NULL END
		WHERE id=$1`,
		runID, r.Status, r.PagesFetched, r.ProductsSeen, r.DealsFound, r.Errors, r.RateLimited, r.Message, finished)
	return err
}

// CrawlState is wat we per product-URL weten om de wachtrij te prioriteren.
type CrawlState struct {
	CrawledAt time.Time // zero = productpagina nog nooit bezocht
	IsDeal    bool
}

// CrawlStates geeft per product-URL wanneer de productpagina voor het laatst bezocht is.
func (s *Store) CrawlStates(ctx context.Context, shopID int) (map[string]CrawlState, error) {
	rows, err := s.pool.Query(ctx, `SELECT url, last_crawled_at, is_deal FROM products WHERE shop_id=$1`, shopID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]CrawlState{}
	for rows.Next() {
		var (
			u      string
			at     *time.Time
			isDeal bool
		)
		if err := rows.Scan(&u, &at, &isDeal); err != nil {
			return nil, err
		}
		st := CrawlState{IsDeal: isDeal}
		if at != nil {
			st.CrawledAt = *at
		}
		out[u] = st
	}
	return out, rows.Err()
}

// ExpireStale zet deals uit van producten die we sinds `cutoff` niet meer gezien hebben
// (uitverkocht, verwijderd of niet meer in de aanbieding).
func (s *Store) ExpireStale(ctx context.Context, shopID int, cutoff time.Time) (int64, error) {
	tag, err := s.pool.Exec(ctx, `
		UPDATE products SET is_deal=false, deal_since=NULL, updated_at=now()
		WHERE shop_id=$1 AND is_deal AND last_seen_at < $2`, shopID, cutoff)
	return tag.RowsAffected(), err
}

// MarkGone verwijdert de deal-status van een product waarvan de pagina 404 geeft.
func (s *Store) MarkGone(ctx context.Context, shopID int, url string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE products SET is_deal=false, deal_since=NULL, in_stock=false, updated_at=now()
		WHERE shop_id=$1 AND url=$2`, shopID, url)
	return err
}

type UpsertResult struct {
	IsNew  bool
	IsDeal bool
}

// UpsertProduct slaat een product op, houdt de prijshistorie bij en bepaalt of het een deal is.
// fromProductPage geeft aan of de data van de productpagina komt (dan wordt last_crawled_at gezet).
//
// Een deal ontstaat alleen uit onze eigen prijswaarnemingen, niet uit de "van"-prijs van de shop:
//   - De eerste waarneming van een product is de nulmeting en nooit een deal.
//   - Referentie = de hoogste prijs die wij sinds de laatste nulmeting zagen (max. 30 dagen terug).
//     Zakt de prijs minstens MinEUR of MinPercent onder die referentie, dan wordt het een deal.
//   - Tijdens een deal blijft de referentie vast; zakt de prijs verder, dan groeit de korting.
//   - Stijgt de prijs weer, dan is de deal voorbij en geldt de nieuwe prijs als nulmeting.
func (s *Store) UpsertProduct(ctx context.Context, shopID int, p parse.Product, category string, fromProductPage bool, rules DealRules) (UpsertResult, error) {
	var res UpsertResult
	if p.Price <= 0 || p.ExternalID == "" {
		return res, errors.New("product zonder prijs of id")
	}
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return res, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	var (
		id               int64
		prevPrice        float64
		prevOld          *float64
		prevRef          *float64
		prevDeal         bool
		baselineSince    *time.Time
		prevCategory     string
		prevShopCategory *string
	)
	err = tx.QueryRow(ctx, `
		SELECT id, price::float8, old_price::float8, reference_price::float8, is_deal, baseline_since,
			category_slug, shop_category
		FROM products WHERE shop_id=$1 AND external_id=$2 FOR UPDATE`, shopID, p.ExternalID).
		Scan(&id, &prevPrice, &prevOld, &prevRef, &prevDeal, &baselineSince, &prevCategory, &prevShopCategory)
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		res.IsNew = true
	case err != nil:
		return res, err
	}

	oldPrice := 0.0
	switch {
	case p.OldPrice > p.Price:
		oldPrice = p.OldPrice
	case !res.IsNew && prevOld != nil && *prevOld > p.Price && math.Abs(prevPrice-p.Price) < 0.005:
		// Sommige shops tonen de "van"-prijs alleen op de categoriepagina; zolang de
		// prijs gelijk blijft houden we de eerder gevonden oude prijs vast.
		oldPrice = *prevOld
	}

	// resetBaseline: de prijs is na een deal weer gestegen; oudere historie telt niet meer mee.
	var reference float64
	resetBaseline := false
	switch {
	case res.IsNew:
		// Eerste waarneming: dit is de nulmeting.
	case prevDeal && p.Price > prevPrice+0.005:
		resetBaseline = true
	case prevDeal && prevRef != nil:
		reference = *prevRef
	default:
		// Hoogste prijs sinds de nulmeting die in de afgelopen 30 dagen gold (eigen historie).
		if err := tx.QueryRow(ctx, `
			SELECT COALESCE(MAX(price), 0)::float8 FROM (
				SELECT price FROM price_history WHERE product_id=$1
					AND observed_at >= GREATEST(now() - interval '30 days', COALESCE($2, '-infinity'::timestamptz))
				UNION ALL
				(SELECT price FROM price_history WHERE product_id=$1
					AND observed_at < now() - interval '30 days' AND observed_at >= COALESCE($2, '-infinity'::timestamptz)
				 ORDER BY observed_at DESC LIMIT 1)
			) t`, id, baselineSince).Scan(&reference); err != nil {
			return res, err
		}
	}

	var discount, percent float64
	if reference > p.Price {
		discount = round2(reference - p.Price)
		percent = round2(discount / reference * 100)
	}
	// Absurde kortingen zijn vrijwel altijd parse-fouten.
	res.IsDeal = percent <= 90 && (discount >= rules.MinEUR || percent >= rules.MinPercent) && discount > 0

	var refArg, oldArg *float64
	if reference > p.Price {
		refArg = &reference
	}
	if oldPrice > 0 {
		oldArg = &oldPrice
	}
	shopCategory := strings.Join(p.Breadcrumbs, " / ")
	if shopCategory == "" {
		shopCategory = p.CategoryHint
	}
	// Een listing kent vaak alleen een grove categorie; overschrijf geen betere data van de productpagina.
	// Omgekeerd houden we de categorie uit de listing als de productpagina er zelf geen heeft (Droneshop).
	if (!fromProductPage || shopCategory == "") && !res.IsNew && prevShopCategory != nil && *prevShopCategory != "" {
		shopCategory = *prevShopCategory
		category = prevCategory
	}

	// deal_since in milliseconden: de website bewaart (deal_since, id) als Discord-cursor in een
	// JS Date; met microseconden bleef de laatste deal "nieuwer" dan de cursor en werd hij elke
	// ronde opnieuw gepost.
	if res.IsNew {
		err = tx.QueryRow(ctx, `
			INSERT INTO products (shop_id, external_id, url, sku, name, brand, image_url, category_slug, shop_category,
				price, old_price, reference_price, discount_amount, discount_percent, is_deal, in_stock, deal_since,
				last_crawled_at)
			VALUES ($1,$2,$3,NULLIF($4,''),$5,NULLIF($6,''),NULLIF($7,''),$8,NULLIF($9,''),$10,$11,$12,$13,$14,$15,$16,
				CASE WHEN $15 THEN date_trunc('milliseconds', now()) END, CASE WHEN $17 THEN now() END)
			RETURNING id`,
			shopID, p.ExternalID, p.URL, p.SKU, p.Name, p.Brand, p.ImageURL, category, shopCategory,
			p.Price, oldArg, refArg, discount, percent, res.IsDeal, p.InStock, fromProductPage).Scan(&id)
	} else {
		_, err = tx.Exec(ctx, `
			UPDATE products SET
				url = $2, sku = COALESCE(NULLIF($3,''), sku), name = $4, brand = COALESCE(NULLIF($5,''), brand),
				image_url = COALESCE(NULLIF($6,''), image_url), category_slug = $7, shop_category = NULLIF($8,''),
				price = $9, old_price = $10, reference_price = $11, discount_amount = $12, discount_percent = $13,
				is_deal = $14, in_stock = COALESCE($15, in_stock),
				deal_since = CASE WHEN NOT $14 THEN NULL WHEN is_deal THEN deal_since ELSE date_trunc('milliseconds', now()) END,
				baseline_since = CASE WHEN $17 THEN now() ELSE baseline_since END,
				last_seen_at = now(), updated_at = now(),
				last_crawled_at = CASE WHEN $16 THEN now() ELSE last_crawled_at END
			WHERE id = $1`,
			id, p.URL, p.SKU, p.Name, p.Brand, p.ImageURL, category, shopCategory,
			p.Price, oldArg, refArg, discount, percent, res.IsDeal, p.InStock, fromProductPage, resetBaseline)
	}
	if err != nil {
		return res, err
	}

	prevOldVal := 0.0
	if prevOld != nil {
		prevOldVal = *prevOld
	}
	if res.IsNew || math.Abs(prevPrice-p.Price) >= 0.005 || math.Abs(prevOldVal-oldPrice) >= 0.005 {
		if _, err := tx.Exec(ctx, `INSERT INTO price_history (product_id, price, old_price) VALUES ($1, $2, $3)`,
			id, p.Price, oldArg); err != nil {
			return res, err
		}
	}
	return res, tx.Commit(ctx)
}

func round2(v float64) float64 { return math.Round(v*100) / 100 }
