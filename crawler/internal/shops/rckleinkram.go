package shops

import (
	"context"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// RC-Kleinkram draait op Shopware 5 (zie shopware5.go).
//
//   - Categorieën: de onderste categorieën van de boom /kategorie/sortiert-nach-kategorien/ uit
//     sitemap_index.xml. De merkenboom (sortiert-nach-marken) en de raceseries tonen dezelfde
//     producten nog een keer. Kleding slaan we over.
//   - Listings: 48 producten per pagina met ?n=48, paginering via ?p=N.
type RCKleinkram struct{}

func (*RCKleinkram) Slug() string    { return "rckleinkram" }
func (*RCKleinkram) Name() string    { return "RC-Kleinkram" }
func (*RCKleinkram) BaseURL() string { return "https://www.rc-kleinkram.de" }
func (*RCKleinkram) Description() string {
	return "Duitse shop voor RC-auto-onderdelen en tuning, met veel kleine onderdelen, banden, karosserieën en gereedschap voor wedstrijdrijders."
}

func (s *RCKleinkram) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap_index.xml", nil)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var categories []string
	for _, u := range urls {
		if strings.HasPrefix(u.Loc, s.BaseURL()+"/kategorie/sortiert-nach-kategorien/") && strings.HasSuffix(u.Loc, "/") &&
			!strings.Contains(u.Loc, "/bekleidung/") {
			categories = append(categories, u.Loc)
		}
	}
	var listings []string
	for _, c := range leafCategories(categories, 3) {
		listings = append(listings, c+sw5Query)
	}
	return listings, nil, nil
}

func (s *RCKleinkram) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	return sw5ParseListing(pageURL, doc)
}

func (s *RCKleinkram) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return sw5ParseProduct(pageURL, doc)
}
