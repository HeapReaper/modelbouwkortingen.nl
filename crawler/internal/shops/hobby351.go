package shops

import (
	"context"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Hobby351 (Portugal) draait op PrestaShop zonder vriendelijke URL's. Alle ~3.800 producten komen
// uit de JSON-listing van de hoofdcategorie /index.php?id_category=2&controller=category (zie
// prestashop.go), ~39 pagina's. De JSON geeft geen categorie en de URL ook niet, dus de indeling
// komt uit de naam (meestal Engels).
type Hobby351 struct{}

func (*Hobby351) Slug() string    { return "hobby351" }
func (*Hobby351) Name() string    { return "Hobby351" }
func (*Hobby351) BaseURL() string { return "https://hobby351.com" }
func (*Hobby351) Description() string {
	return "Portugese RC-autowinkel voor wedstrijdrijders met Mugen, Ruddog, banden, onderdelen, gereedschap en elektronica."
}

func (*Hobby351) UserAgent() string { return "" }

func (*Hobby351) MinDelay() time.Duration { return 2 * time.Second }

func (s *Hobby351) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := psSeeds(ctx, f, psFeed(s.BaseURL()+"/index.php?id_category=2&controller=category"))
	return seeds, nil, err
}

func (s *Hobby351) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parsePSListing(pageURL, body, nil)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *Hobby351) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *Hobby351) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
