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

// RCYPadel (Spanje) draait op WooCommerce en verkoopt naast RC ook padel. Alle ~640 producten
// komen uit de Store API (zie woocommerce.go), ~7 pagina's; padel ("Tienda de padel", "Padel para
// todos") slaan we over. Productnamen zijn Spaans (zie src/lib/translate.ts).
type RCYPadel struct{}

func (*RCYPadel) Slug() string    { return "rcypadel" }
func (*RCYPadel) Name() string    { return "RC y Pádel" }
func (*RCYPadel) BaseURL() string { return "https://www.rcypadel.es" }
func (*RCYPadel) Description() string {
	return "Spaanse RC-winkel met auto's, motoren, boten, drones, vliegtuigen en heli's, plus onderdelen, zenders, accu's en verbrandingsmotoren."
}

func (*RCYPadel) UserAgent() string { return "" }

func (*RCYPadel) MinDelay() time.Duration { return 2 * time.Second }

var rcypadelSkipRe = regexp.MustCompile(`(?i)padel`)

func (s *RCYPadel) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{}))
	return seeds, nil, err
}

func (s *RCYPadel) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseWooFeed(pageURL, body, func(cats []string) bool { return rcypadelSkipRe.MatchString(strings.Join(cats, " | ")) }, nil)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *RCYPadel) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *RCYPadel) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
