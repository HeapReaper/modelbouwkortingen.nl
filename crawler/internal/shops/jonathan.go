package shops

import (
	"context"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Jonathan draait op Magento 1.
//
//   - Productpagina's uit jonathanIT_product.xml (~12.600, Italiaans) met een JSON-LD Product;
//     per ronde komt een deel aan de beurt (zie CRAWLER_MAX_PRODUCT_PAGES).
//   - Overgeslagen (op breadcrumbs en naam): tijdschriften, kleding, cadeaubonnen en brandstof.
type Jonathan struct{}

func (*Jonathan) Slug() string    { return "jonathan" }
func (*Jonathan) Name() string    { return "Jonathan" }
func (*Jonathan) BaseURL() string { return "https://shop.jonathan.it" }
func (*Jonathan) Description() string {
	return "Italiaanse RC-importeur en -winkel met vliegtuigen, heli's, auto's en boten van Horizon Hobby, Arrma en Phoenix Model, plus onderdelen en elektronica."
}

var (
	jonathanProductRe = regexp.MustCompile(`^https://shop\.jonathan\.it/it/[^/]+$`)
	jonathanSkipRe    = regexp.MustCompile(`(?i)\b(pubblicazioni|abbigliamento|buoni regalo|gift card|carburante|miscela)\b`)
)

func (s *Jonathan) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/media/sitemap/jonathanIT_product.xml", jonathanProductRe.MatchString)
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Jonathan) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Jonathan) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, nil)
	if p == nil || jonathanSkipRe.MatchString(strings.Join(append(p.Breadcrumbs, p.Name), " | ")) {
		return nil
	}
	return p
}
