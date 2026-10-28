package shops

import (
	"context"
	"regexp"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// RCPro (Spanje) is een grote RC-autowinkel op PrestaShop. Alle ~53.000 producten komen uit de
// JSON-listing van de hoofdcategorie (zie prestashop.go), ~534 pagina's; robots.txt vraagt een
// Crawl-delay van 2 s. De hoofdcategorie heeft geen vriendelijke URL, dus
// /index.php?id_category=2&controller=category. Productnamen zijn Spaans (zie
// src/lib/translate.ts); die-cast slaan we over.
type RCPro struct{}

func (*RCPro) Slug() string    { return "rcpro" }
func (*RCPro) Name() string    { return "RC-Pro" }
func (*RCPro) BaseURL() string { return "https://www.rc-pro.es" }
func (*RCPro) Description() string {
	return "Grote Spaanse RC-autowinkel met Traxxas, Absima, Team Associated en Losi, plus veel onderdelen, banden, carrosserieën, elektronica en accu's."
}

func (*RCPro) UserAgent() string { return "" }

func (*RCPro) MinDelay() time.Duration { return 2 * time.Second }

var rcproSkipRe = regexp.MustCompile(`(?i)die-cast|^1:\d+$`)

func (s *RCPro) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := psSeeds(ctx, f, psFeed(s.BaseURL()+"/index.php?id_category=2&controller=category"))
	return seeds, nil, err
}

func (s *RCPro) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parsePSListing(pageURL, body, rcproSkipRe.MatchString)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *RCPro) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *RCPro) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
