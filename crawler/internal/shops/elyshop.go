package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Elyshop draait op Magento 2.
//
//   - Productpagina's (*.html, ~9.000) uit de sitemap die robots.txt noemt
//     (/pub/media/sitemap/sitemap.xml), met schema.org-microdata. Categoriepagina's hebben geen
//     prijs en vallen in ldParseProduct weg.
type Elyshop struct{}

func (*Elyshop) Slug() string    { return "elyshop" }
func (*Elyshop) Name() string    { return "Elyshop" }
func (*Elyshop) BaseURL() string { return "https://www.elyshop.com" }
func (*Elyshop) Description() string {
	return "Italiaanse RC-shop met helikopters, vliegtuigen, drones en auto's, plus veel onderdelen (onder meer Align), servo's en elektronica."
}

var (
	elyshopProductRe = regexp.MustCompile(`^https://www\.elyshop\.com/[^/?]+\.html$`)
)

func (s *Elyshop) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/pub/media/sitemap/sitemap.xml", elyshopProductRe.MatchString)
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Elyshop) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Elyshop) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, nil)
	return p
}
