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

// ScaleRCBuzz (Portugal) is een crawlerspecialist op WooCommerce. Alle ~560 producten komen uit de
// Store API (zie woocommerce.go), ~6 pagina's. Productnamen zijn Engels en Portugees (zie
// src/lib/translate.ts); merchandise slaan we over.
type ScaleRCBuzz struct{}

func (*ScaleRCBuzz) Slug() string    { return "scalercbuzz" }
func (*ScaleRCBuzz) Name() string    { return "scaleRCBuzz" }
func (*ScaleRCBuzz) BaseURL() string { return "https://scalercbuzz.com" }
func (*ScaleRCBuzz) Description() string {
	return "Portugese crawlerspecialist met RC4WD-onderdelen, velgen, banden, scale-accessoires, elektronica en een paar complete auto's."
}

func (*ScaleRCBuzz) UserAgent() string { return "" }

func (*ScaleRCBuzz) MinDelay() time.Duration { return 2 * time.Second }

var scalercbuzzSkipRe = regexp.MustCompile(`(?i)merchandise`)

func (s *ScaleRCBuzz) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{}))
	return seeds, nil, err
}

func (s *ScaleRCBuzz) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseWooFeed(pageURL, body, func(cats []string) bool { return scalercbuzzSkipRe.MatchString(strings.Join(cats, " | ")) }, nil)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *ScaleRCBuzz) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *ScaleRCBuzz) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
