package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Kopterworx draait op een eigen shopsysteem.
//
//   - Productpagina's (*.html, ~2.300) uit sitemap.xml, met schema.org-microdata. Infopagina's
//     (/the-company/) slaan we over; categoriepagina's hebben geen prijs en vallen in
//     ldParseProduct weg.
type Kopterworx struct{}

func (*Kopterworx) Slug() string    { return "kopterworx" }
func (*Kopterworx) Name() string    { return "Kopterworx" }
func (*Kopterworx) BaseURL() string { return "https://www.kopterworx.com" }
func (*Kopterworx) Description() string {
	return "Sloveense dronespecialist met DJI-drones, gimbals, onderdelen en toebehoren."
}

var (
	kopterworxProductRe = regexp.MustCompile(`^https://www\.kopterworx\.com/[^?]+\.html$`)
	kopterworxSkipURLRe = regexp.MustCompile(`/the-company/`)
)

func (s *Kopterworx) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/sitemap.xml", func(loc string) bool {
		return kopterworxProductRe.MatchString(loc) && !kopterworxSkipURLRe.MatchString(loc)
	})
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Kopterworx) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Kopterworx) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, nil)
	return p
}
