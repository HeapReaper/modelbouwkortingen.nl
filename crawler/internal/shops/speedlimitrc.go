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

// SpeedLimitRC (Spanje) is een modelvliegspecialist op WooCommerce. Alle ~1.100 producten komen
// uit de Store API (zie woocommerce.go), ~11 pagina's. Productnamen zijn Spaans (zie
// src/lib/translate.ts); brandstof ("Garrafas/Combustible/Humo") slaan we over.
type SpeedLimitRC struct{}

func (*SpeedLimitRC) Slug() string    { return "speedlimitrc" }
func (*SpeedLimitRC) Name() string    { return "SpeedLimit RC" }
func (*SpeedLimitRC) BaseURL() string { return "https://speedlimitrc.com" }
func (*SpeedLimitRC) Description() string {
	return "Spaanse modelvliegspecialist met FMS-, Freewing- en HSD-vliegtuigen, benzine- en turbinejets en veel onderdelen, plus servo's en elektronica."
}

func (*SpeedLimitRC) UserAgent() string { return "" }

func (*SpeedLimitRC) MinDelay() time.Duration { return 2 * time.Second }

var speedlimitrcSkipRe = regexp.MustCompile(`(?i)combustible`)

func (s *SpeedLimitRC) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{}))
	return seeds, nil, err
}

func (s *SpeedLimitRC) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseWooFeed(pageURL, body, func(cats []string) bool { return speedlimitrcSkipRe.MatchString(strings.Join(cats, " | ")) }, nil)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *SpeedLimitRC) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *SpeedLimitRC) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
