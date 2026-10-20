package shops

import (
	"context"
	"net/url"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Trxxs (Trxxs-Winkel, Lommel, België) is een Traxxas-specialist op WooCommerce. Alle ~12.000
// producten komen uit de Store API (zie woocommerce.go), ~120 pagina's. Veel producten hebben
// geen categorie; die worden op de naam ingedeeld.
type Trxxs struct{}

func (*Trxxs) Slug() string    { return "trxxs" }
func (*Trxxs) Name() string    { return "Trxxs-Winkel" }
func (*Trxxs) BaseURL() string { return "https://www.trxxs-winkel.be" }
func (*Trxxs) Description() string {
	return "Belgische Traxxas-specialist in Lommel met ook Arrma, Losi, Axial en Pro Boat: auto's, boten, onderdelen en accu's."
}

func (*Trxxs) UserAgent() string { return "" }

// MinDelay: geen Crawl-delay in robots.txt, maar elke pagina komt uit WordPress.
func (*Trxxs) MinDelay() time.Duration { return 2 * time.Second }

func (s *Trxxs) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{}))
	return seeds, nil, err
}

func (s *Trxxs) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseWooFeed(pageURL, body, nil, nil)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *Trxxs) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *Trxxs) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
