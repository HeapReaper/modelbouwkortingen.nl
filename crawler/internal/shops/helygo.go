package shops

import (
	"context"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// HelyGo (Italië) draait op PrestaShop. Alle ~5.900 producten komen uit de JSON-listing van de
// hoofdcategorie (zie prestashop.go), ~60 pagina's; robots.txt vraagt een Crawl-delay van 5 s. De
// JSON geeft geen categorie, maar de categorie staat in de URL ("/radio-auto/", "/servi-mini/").
// Productnamen zijn Italiaans (zie src/lib/translate.ts).
type HelyGo struct{}

func (*HelyGo) Slug() string    { return "helygo" }
func (*HelyGo) Name() string    { return "Hely-Go!" }
func (*HelyGo) BaseURL() string { return "https://hely-go.net" }
func (*HelyGo) Description() string {
	return "Italiaanse RC-winkel met auto's, crawlers, vliegtuigen en heli's, plus veel onderdelen, servo's, lipo's, zenders en gereedschap."
}

func (*HelyGo) UserAgent() string { return "" }

func (*HelyGo) MinDelay() time.Duration { return 5 * time.Second }

func (s *HelyGo) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := psSeeds(ctx, f, psFeed(s.BaseURL()+"/2-categorie"))
	return seeds, nil, err
}

func (s *HelyGo) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parsePSListing(pageURL, body, nil)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *HelyGo) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *HelyGo) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
