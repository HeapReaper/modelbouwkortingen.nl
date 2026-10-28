package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Derkum Modellbau draait op een eigen shopsysteem.
//
//   - Productpagina's uit sitemap.xml (~8.000 URL's, ook categorieën); de productpagina's hebben
//     schema.org-microdata. Categoriepagina's hebben geen prijs en vallen in ldParseProduct weg.
//     Infopagina's en de catalogus slaan we over.
type Derkum struct{}

func (*Derkum) Slug() string    { return "derkum" }
func (*Derkum) Name() string    { return "Derkum Modellbau" }
func (*Derkum) BaseURL() string { return "https://www.derkum-modellbau.com" }
func (*Derkum) Description() string {
	return "Duitse modelbouwshop uit Keulen met vliegtuigen, RC-auto's, boten, elektronica, motoren en veel onderdelen."
}

var (
	derkumProductRe = regexp.MustCompile(`^https://www\.derkum-modellbau\.com/[^/?]+/[^?]+$`)
	derkumSkipURLRe = regexp.MustCompile(`^https://www\.derkum-modellbau\.com/(katalog|pages|sites|versand)/`)
)

func (s *Derkum) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/sitemap.xml", func(loc string) bool {
		return derkumProductRe.MatchString(loc) && !derkumSkipURLRe.MatchString(loc)
	})
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Derkum) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Derkum) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, nil)
	return p
}
