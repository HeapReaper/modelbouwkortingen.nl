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

// SmartModelismo (Portugal) draait op WooCommerce. Alle ~12.700 producten komen uit de Store API
// (zie woocommerce.go), ~128 pagina's; robots.txt vraagt een Crawl-delay van 5 s, een ronde duurt
// dus ruim tien minuten. Productnamen zijn Portugees (zie src/lib/translate.ts). Statische
// modelbouw, educatief speelgoed ("Didáticos"), 3D-printen en brandstof slaan we over.
type SmartModelismo struct{}

func (*SmartModelismo) Slug() string    { return "smartmodelismo" }
func (*SmartModelismo) Name() string    { return "Smart Modelismo" }
func (*SmartModelismo) BaseURL() string { return "https://smartmodelismo.pt" }
func (*SmartModelismo) Description() string {
	return "Grote Portugese RC-winkel met auto's, crawlers, tanks, werkvoertuigen, vliegtuigen en boten, plus veel onderdelen, carrosserieën en elektronica."
}

func (*SmartModelismo) UserAgent() string { return "" }

func (*SmartModelismo) MinDelay() time.Duration { return 5 * time.Second }

var smartmodelismoSkipRe = regexp.MustCompile(`(?i)modelismo estático|didáticos|brinquedos|funko|cartas magic|impressão 3d|combustível|nitro \d`)

func (s *SmartModelismo) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{}))
	return seeds, nil, err
}

func (s *SmartModelismo) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseWooFeed(pageURL, body, func(cats []string) bool { return smartmodelismoSkipRe.MatchString(strings.Join(cats, " | ")) }, nil)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *SmartModelismo) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *SmartModelismo) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
