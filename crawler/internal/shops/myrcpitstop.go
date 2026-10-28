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

// MyRCPitstop (Nicosia, Cyprus) draait op WooCommerce. Alle ~1.200 producten komen uit de Store
// API (zie woocommerce.go), ~12 pagina's. Productnamen zijn Engels. De categorieën per merk
// ("Traxxas RC Cars & Parts", "Team XRAY Racing Cars") bevatten ook alle onderdelen en tellen niet
// mee voor de indeling. Cadeaubonnen, brandstof en gebruikte auto's slaan we over.
type MyRCPitstop struct{}

func (*MyRCPitstop) Slug() string    { return "myrcpitstop" }
func (*MyRCPitstop) Name() string    { return "MyRCPitstop" }
func (*MyRCPitstop) BaseURL() string { return "https://myrcpitstop.eu" }
func (*MyRCPitstop) Description() string {
	return "Cypriotische RC-winkel in Nicosia met veel Traxxas-onderdelen, plus Sworkz, Xray, Hudy, lagers, pinions, accu's en elektronica."
}

func (*MyRCPitstop) UserAgent() string { return "" }

func (*MyRCPitstop) MinDelay() time.Duration { return 2 * time.Second }

var myrcpitstopSkipRe = regexp.MustCompile(`(?i)gift cards|fuel|used rc`)

var myrcpitstopIgnoreCategoryRe = regexp.MustCompile(`(?i)rc cars & parts$|racing cars$`)

func (s *MyRCPitstop) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{}))
	return seeds, nil, err
}

func (s *MyRCPitstop) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseWooFeed(pageURL, body, func(cats []string) bool { return myrcpitstopSkipRe.MatchString(strings.Join(cats, " | ")) }, func(c string) bool { return !myrcpitstopIgnoreCategoryRe.MatchString(c) })
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *MyRCPitstop) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *MyRCPitstop) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
