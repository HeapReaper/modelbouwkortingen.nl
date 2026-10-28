package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Modellbau Metz draait op een eigen shopsysteem.
//
//   - Productpagina's (/modellbau/<slug>, ~34.000) uit sitemap.xml, met schema.org-microdata;
//     per ronde komt een deel aan de beurt (zie CRAWLER_MAX_PRODUCT_PAGES). De
//     /katalog/artikelinfo/-URL's zijn varianten van dezelfde producten en slaan we over.
type Metz struct{}

func (*Metz) Slug() string    { return "metz" }
func (*Metz) Name() string    { return "Modellbau Metz" }
func (*Metz) BaseURL() string { return "https://www.modellbau-metz.com" }
func (*Metz) Description() string {
	return "Duitse modelbouwshop met RC-auto's en veel onderdelen en tuning van onder meer Traxxas en Arrma."
}

var (
	metzProductRe = regexp.MustCompile(`^https://www\.modellbau-metz\.com/modellbau/[^/?]+$`)
)

func (s *Metz) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/sitemap.xml", metzProductRe.MatchString)
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Metz) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Metz) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, nil)
	return p
}
