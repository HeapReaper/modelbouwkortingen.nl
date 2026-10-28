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

// RC-Race-Shop draait op Shopware 6 (zie shopware6.go).
//
//   - robots.txt verbiedt alle URL's met een query (/*?), dus ook de paginering van de
//     listings. We bezoeken daarom de productpagina's uit sitemap.xml (~15.500): alles wat niet
//     op "/" eindigt (dat zijn categorieën), zonder de infopagina's en /navigation/-links. Per
//     ronde komt een deel aan de beurt (zie CRAWLER_MAX_PRODUCT_PAGES).
type RCRaceShop struct{}

func (*RCRaceShop) Slug() string    { return "rcraceshop" }
func (*RCRaceShop) Name() string    { return "RC-Race-Shop" }
func (*RCRaceShop) BaseURL() string { return "https://www.rc-race-shop.de" }
func (*RCRaceShop) Description() string {
	return "RC-autoshop uit Berlijn met veel onderdelen en tuning per merk en model (Traxxas, GPM, Hobao, CEN, Corally), plus modellen en karosserieën."
}

var rcRaceShopSkipRe = regexp.MustCompile(`^(navigation/|(impressum|agb|datenschutz|widerrufsrecht|widerrufsformular|batterieverordnung|newsletter|versand-und-zahlung|kontakt)$)`)

func (s *RCRaceShop) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/sitemap.xml", func(loc string) bool {
		path, ok := strings.CutPrefix(loc, s.BaseURL()+"/")
		return ok && path != "" && !strings.HasSuffix(path, "/") && !rcRaceShopSkipRe.MatchString(path)
	})
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *RCRaceShop) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *RCRaceShop) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return sw6ParseProduct(pageURL, doc)
}
