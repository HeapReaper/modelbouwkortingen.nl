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

// TTModelismo (Portugal) draait op WooCommerce. Alle ~4.000 producten komen uit de Store API (zie
// woocommerce.go), ~41 pagina's. Productnamen zijn deels Portugees (zie src/lib/translate.ts).
// Ruilkaarten en Warhammer ("TCG / Warhammer"), speelgoed en merchandise ("Diversos"), treinen en
// brandstof slaan we over, op categorie en op URL.
type TTModelismo struct{}

func (*TTModelismo) Slug() string    { return "ttmodelismo" }
func (*TTModelismo) Name() string    { return "TTmodelismo" }
func (*TTModelismo) BaseURL() string { return "https://ttmodelismo.com" }
func (*TTModelismo) Description() string {
	return "Portugese RC-autowinkel met crawlers en scale-auto's, veel Injora-onderdelen, banden, carrosserieën, elektronica en accu's."
}

func (*TTModelismo) UserAgent() string { return "" }

func (*TTModelismo) MinDelay() time.Duration { return 2 * time.Second }

var ttmodelismoSkipRe = regexp.MustCompile(`(?i)tcg|warhammer|pokemon|lorcana|riftbound|diversos|merchandising|pop! figures|nerf|jogos|brinquedos|combustível`)

func (s *TTModelismo) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{}))
	return seeds, nil, err
}

func (s *TTModelismo) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	products, next := parseWooFeed(pageURL, body, func(cats []string) bool { return ttmodelismoSkipRe.MatchString(strings.Join(cats, " | ")) }, nil)
	out := products[:0]
	for _, p := range products {
		if !ttmodelismoSkipURLRe.MatchString(p.URL) {
			out = append(out, p)
		}
	}
	return out, next
}

// ttmodelismoSkipURLRe: producten staan vaak alleen in de diepste categorie ("Singles",
// "T-shirts"); de hoofdcategorie staat wel in de URL.
var ttmodelismoSkipURLRe = regexp.MustCompile(`/shop/(tcg|diversos[^/]*|termico-nitro/combustivel)/|/comboios/`)

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *TTModelismo) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *TTModelismo) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
