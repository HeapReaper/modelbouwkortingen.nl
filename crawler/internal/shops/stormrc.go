package shops

import (
	"context"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// StormRC (Frankrijk) draait op WooCommerce. Alle ~900 producten komen uit de Store API (zie
// woocommerce.go), ~9 pagina's. Productnamen zijn Frans (zie src/lib/translate.ts). Elk product
// staat in de hoofdcategorie van zijn voertuig ("Voitures RC"), ook onderdelen; die en de andere
// verzamelcategorieën (merken, schalen, aandrijving) tellen niet mee voor de indeling. Brandstof
// slaan we over.
type StormRC struct{}

func (*StormRC) Slug() string    { return "stormrc" }
func (*StormRC) Name() string    { return "Storm RC" }
func (*StormRC) BaseURL() string { return "https://storm-rc.com" }
func (*StormRC) Description() string {
	return "Franse RC-winkel met Tamiya-, Kyosho- en Traxxas-auto's en onderdelen, plus accu's, banden en een paar vliegtuigen en boten."
}

func (*StormRC) UserAgent() string { return "" }

func (*StormRC) MinDelay() time.Duration { return 2 * time.Second }

var stormrcSkipRe = regexp.MustCompile(`(?i)carburant`)

var stormrcIgnoreCategoryRe = regexp.MustCompile(`(?i)^(voitures rc|avions rc|bateaux rc|marques|pièces, accessoires et électronique|échelles|énergies|électrique|thermique|niveaux de finition|kit à monter|rtr kit .*|types|type avions|1/\d+)$`)

func (s *StormRC) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{}))
	return seeds, nil, err
}

func (s *StormRC) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseWooFeed(pageURL, body, func(cats []string) bool { return stormrcSkipRe.MatchString(strings.Join(cats, " | ")) }, func(c string) bool { return !stormrcIgnoreCategoryRe.MatchString(c) })
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *StormRC) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *StormRC) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
