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

// RCStoreAlgarve (Portugal) draait op WooCommerce. Alle ~1.600 producten komen uit de Store API
// (zie woocommerce.go), ~17 pagina's. Productnamen zijn Portugees (zie src/lib/translate.ts).
// Statische modelbouw, speelgoed en bordspellen (Hot Wheels, LEGO) en brandstof slaan we over;
// verf en gereedschap blijven. "Aviões e Helicópteros" telt niet mee voor de indeling: dan zou elk
// vliegtuig een heli worden.
type RCStoreAlgarve struct{}

func (*RCStoreAlgarve) Slug() string    { return "rcstorealgarve" }
func (*RCStoreAlgarve) Name() string    { return "RC Store Algarve" }
func (*RCStoreAlgarve) BaseURL() string { return "https://rcstorealgarve.pt" }
func (*RCStoreAlgarve) Description() string {
	return "Portugese RC-winkel in de Algarve met elektrische en nitro-auto's, crawlers, onderdelen, accu's en elektronica, plus veel verf en gereedschap."
}

func (*RCStoreAlgarve) UserAgent() string { return "" }

func (*RCStoreAlgarve) MinDelay() time.Duration { return 2 * time.Second }

var rcstorealgarveSkipRe = regexp.MustCompile(`(?i)modelismo estático|brinquedos|hot wheels|lego|jogos|combustíveis`)

var rcstorealgarveIgnoreCategoryRe = regexp.MustCompile(`(?i)^aviões e helicópteros$`)

func (s *RCStoreAlgarve) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{}))
	return seeds, nil, err
}

func (s *RCStoreAlgarve) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseWooFeed(pageURL, body, func(cats []string) bool { return rcstorealgarveSkipRe.MatchString(strings.Join(cats, " | ")) }, func(c string) bool { return !rcstorealgarveIgnoreCategoryRe.MatchString(c) })
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *RCStoreAlgarve) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *RCStoreAlgarve) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
