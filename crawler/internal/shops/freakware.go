package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Freakware heeft een eigen shopsysteem.
//
//   - Duitse productpagina's (/p/<slug>-a<id>.htm, ~17.000) uit sitemap.xml; de Engelse kopieën
//     onder /en/ slaan we over. Per ronde komt een deel aan de beurt (zie
//     CRAWLER_MAX_PRODUCT_PAGES). robots.txt vraagt 2 seconden tussen verzoeken; de fetcher
//     houdt zich daaraan.
type Freakware struct{}

func (*Freakware) Slug() string    { return "freakware" }
func (*Freakware) Name() string    { return "Freakware" }
func (*Freakware) BaseURL() string { return "https://www.freakware.de" }
func (*Freakware) Description() string {
	return "Duitse RC-shop met auto's, heli's, vliegtuigen en drones en een zeer groot aanbod onderdelen."
}

var (
	freakwareProductRe = regexp.MustCompile(`^https://www\.freakware\.de/p/[^/?]+-a\d+\.htm$`)
	freakwareIDRe      = regexp.MustCompile(`-a(\d+)\.htm$`)
)

func (s *Freakware) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/sitemap.xml", freakwareProductRe.MatchString)
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Freakware) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Freakware) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, freakwareIDRe)
	return p
}
