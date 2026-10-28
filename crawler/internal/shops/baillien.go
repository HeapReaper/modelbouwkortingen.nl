package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Modelbouw Baillien draait op Odoo.
//
//   - Productpagina's (/shop/<slug>-<id>, ~39.000) uit sitemap.xml, met schema.org-microdata;
//     per ronde komt een deel aan de beurt (zie CRAWLER_MAX_PRODUCT_PAGES).
type Baillien struct{}

func (*Baillien) Slug() string    { return "baillien" }
func (*Baillien) Name() string    { return "Modelbouw Baillien" }
func (*Baillien) BaseURL() string { return "https://www.modelbouw-baillien.be" }
func (*Baillien) Description() string {
	return "Belgische modelbouwwinkel met RC-auto's, vliegtuigen, boten, treinen, bouwdozen en veel onderdelen."
}

var (
	baillienProductRe = regexp.MustCompile(`^https://www\.modelbouw-baillien\.be/shop/[^/?]+-\d+$`)
	baillienIDRe      = regexp.MustCompile(`/shop/[^/?]+-(\d+)$`)
)

func (s *Baillien) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/sitemap.xml", baillienProductRe.MatchString)
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Baillien) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Baillien) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, baillienIDRe)
	return p
}
