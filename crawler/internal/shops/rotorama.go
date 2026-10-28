package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Rotorama.com is de Engelstalige euro-shop van Rotorama (Praag).
//
//   - Productpagina's (/product/<slug>, ~2.500) uit sitemap.xml, met schema.org-microdata.
type Rotorama struct{}

func (*Rotorama) Slug() string    { return "rotorama" }
func (*Rotorama) Name() string    { return "Rotorama" }
func (*Rotorama) BaseURL() string { return "https://www.rotorama.com" }
func (*Rotorama) Description() string {
	return "Tsjechische FPV-shop met drones, frames, motoren, flightcontrollers, videozenders, brillen en accu's."
}

var (
	rotoramaProductRe = regexp.MustCompile(`^https://www\.rotorama\.com/product/[^/?]+$`)
)

func (s *Rotorama) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/sitemap.xml", rotoramaProductRe.MatchString)
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Rotorama) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Rotorama) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, nil)
	return p
}
