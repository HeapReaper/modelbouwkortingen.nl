package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// D-M-T draait op Joomla met VirtueMart.
//
//   - Productpagina's (URL's die op -detail eindigen, ~20.000) uit sitemap-1.xml en
//     sitemap-2.xml, met een JSON-LD Product; per ronde komt een deel aan de beurt (zie
//     CRAWLER_MAX_PRODUCT_PAGES). Cadeaubonnen en merchandise slaan we over.
type DMT struct{}

func (*DMT) Slug() string    { return "dmt" }
func (*DMT) Name() string    { return "D-M-T Modellsport" }
func (*DMT) BaseURL() string { return "https://www.d-m-t.at" }
func (*DMT) Description() string {
	return "Modelbouwshop uit Dobl-Zwaring (Stiermarken) met vliegtuigen, heli's, RC-auto's en drones, plus veel motoren, servo's, elektronica, accu's en materialen."
}

var (
	dmtProductRe = regexp.MustCompile(`^https://www\.d-m-t\.at/[^?]+-detail$`)
	dmtSkipURLRe = regexp.MustCompile(`/gutscheine-merchandise/`)
)

func (s *DMT) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	isProduct := func(loc string) bool {
		return dmtProductRe.MatchString(loc) && !dmtSkipURLRe.MatchString(loc)
	}
	var products []sitemap.URL
	for _, sm := range []string{"/sitemap-1.xml", "/sitemap-2.xml"} {
		urls, err := ldSitemapProducts(ctx, f, s.BaseURL()+sm, isProduct)
		if err != nil {
			return nil, products, err
		}
		products = append(products, urls...)
	}
	return nil, products, nil
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *DMT) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *DMT) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, nil)
	return p
}
