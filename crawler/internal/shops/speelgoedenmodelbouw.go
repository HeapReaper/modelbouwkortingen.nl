package shops

import (
	"context"
	"net/url"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// SpeelgoedenModelbouw is een Nederlandse speelgoed- en modelbouwwinkel op WooCommerce
// (speelgoedenmodelbouw.nl verwijst door naar .com). Het grootste deel van de ~11.000
// producten is LEGO en Playmobil; we nemen alleen de categorie R/C (id 161, ~3200 producten,
// vooral Tamiya en Carson) via de Store API (zie woocommerce.go). Daarin staan ook wat
// statische Tamiya-bouwdozen, die slaan we over.
type SpeelgoedenModelbouw struct{}

const speelgoedenmodelbouwRC = "161"

func (*SpeelgoedenModelbouw) Slug() string    { return "speelgoedenmodelbouw" }
func (*SpeelgoedenModelbouw) Name() string    { return "SPEELGOEDenMODELBOUW" }
func (*SpeelgoedenModelbouw) BaseURL() string { return "https://www.speelgoedenmodelbouw.com" }
func (*SpeelgoedenModelbouw) Description() string {
	return "Nederlandse speelgoed- en modelbouwwinkel met veel Tamiya: RC-auto's, tanks, trucks en onderdelen, plus Carson en Kyosho."
}

func (*SpeelgoedenModelbouw) UserAgent() string { return "" }

// MinDelay: geen Crawl-delay in robots.txt, maar elke pagina is ~0,7 MB uit WordPress.
func (*SpeelgoedenModelbouw) MinDelay() time.Duration { return 2 * time.Second }

func (s *SpeelgoedenModelbouw) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{"category": {speelgoedenmodelbouwRC}}))
	return seeds, nil, err
}

func (s *SpeelgoedenModelbouw) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseWooFeed(pageURL, body, func(cats []string) bool { return wooHasCategory(cats, "statische modelbouw") }, nil)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *SpeelgoedenModelbouw) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *SpeelgoedenModelbouw) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
