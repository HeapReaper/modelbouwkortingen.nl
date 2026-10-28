package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// TFL Hobby draait op Gambio.
//
//   - Productpagina's uit /public/sitemap_index.xml (~1.000, alles wat op .html eindigt, zonder
//     /info/) met een JSON-LD Product.
type TFL struct{}

func (*TFL) Slug() string    { return "tfl" }
func (*TFL) Name() string    { return "TFL Hobby" }
func (*TFL) BaseURL() string { return "https://www.tfl-hobby.de" }
func (*TFL) Description() string {
	return "Webshop uit Briesen (Brandenburg) voor RC-speedboten: propellers, aandrijvingen, flexassen, motoren, waterkoeling, roeren en uitlaten."
}

var (
	tflProductRe = regexp.MustCompile(`^https://www\.tfl-hobby\.de/[^?]+\.html$`)
	tflSkipURLRe = regexp.MustCompile(`/info/`)
)

func (s *TFL) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/public/sitemap_index.xml", func(loc string) bool {
		return tflProductRe.MatchString(loc) && !tflSkipURLRe.MatchString(loc)
	})
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *TFL) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *TFL) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, nil)
	return p
}
