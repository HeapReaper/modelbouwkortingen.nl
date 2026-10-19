package shops

import (
	"context"
	"net/url"
	"slices"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// TheBorder (The-Border.com RC, Mijdrecht) draait op WooCommerce. Alle ~35.000 producten
// komen uit de Store API (zie woocommerce.go); robots.txt vraagt een Crawl-delay van 5 s,
// een ronde van ~350 pagina's duurt dus een half uur. De Carrera-racebanen (id 2825) laten
// we weg, net als bij Hepf, en ook de andere producten die geen RC zijn (theborderSkip).
type TheBorder struct{}

const theborderCarrera = "2825"

func (*TheBorder) Slug() string    { return "theborder" }
func (*TheBorder) Name() string    { return "The Border RC" }
func (*TheBorder) BaseURL() string { return "https://www.the-border.com" }
func (*TheBorder) Description() string {
	return "RC-winkel in Mijdrecht met een groot aanbod auto's en onderdelen van Traxxas, Kyosho, Axial, XRAY en meer, plus boten en accu's."
}

func (s *TheBorder) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{"category": {theborderCarrera}, "category_operator": {"not_in"}}))
	return seeds, nil, err
}

// theborderSkip slaat de producten over die geen RC zijn: slotcar-accessoires, die-cast,
// plastic bouwdozen en LEGO.
func theborderSkip(cats []string) bool {
	for _, sub := range []string{"slotcar", "die-cast", "die cast", "plastic model kits"} {
		if wooHasCategory(cats, sub) {
			return true
		}
	}
	return slices.Contains(cats, "Lego")
}

func (s *TheBorder) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseWooFeed(pageURL, body, theborderSkip)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *TheBorder) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *TheBorder) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
