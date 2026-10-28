package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// RC-Europe heeft een aparte productsitemap (/sitemaps/sitemap-products-nl.xml, ~150 producten);
// de productpagina's hebben een JSON-LD Product.
type RCEurope struct{}

func (*RCEurope) Slug() string    { return "rceurope" }
func (*RCEurope) Name() string    { return "RC-Europe" }
func (*RCEurope) BaseURL() string { return "https://www.rc-europe.eu" }
func (*RCEurope) Description() string {
	return "Nederlandse maker van lasergesneden bouwpakketten voor RC-vliegtuigen (scale, warbirds, vintage), met bouwtekeningen en toebehoren."
}

var (
	rceuropeProductRe = regexp.MustCompile(`^https://www\.rc-europe\.eu/`)
)

func (s *RCEurope) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/sitemaps/sitemap-products-nl.xml", rceuropeProductRe.MatchString)
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *RCEurope) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *RCEurope) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, nil)
	return p
}
