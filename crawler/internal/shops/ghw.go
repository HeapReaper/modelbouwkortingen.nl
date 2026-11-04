package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// GHW Modellbau draait op JTL-Shop 5 (NOVA-thema, zie jtl.go). Categorieën uit /Sitemap, zonder de
// accountlinks; listings met ?af=50.
type GHW struct{}

func (*GHW) Slug() string    { return "ghw" }
func (*GHW) Name() string    { return "GHW Modellbau" }
func (*GHW) BaseURL() string { return "https://ghw-modellbau.de" }
func (*GHW) Description() string {
	return "Duitse modelbouwshop voor RC-graafmachines en hydrauliek, met materialen, schroeven, aandrijving, elektronica en gereedschap."
}

// PriceFactor: bots krijgen de prijs zonder btw ("inkl. 0% USt."). Volgens de verzendinformatie
// rekent GHW de btw van het afleverland (zie vat.go).
func (*GHW) PriceFactor() float64 { return 1 + nlVAT/100 }

var ghwSkipTopRe = regexp.MustCompile(`(?i)^(zum warenkorb|facebook|jtl-shop|passwort vergessen|jetzt registrieren)`)

func (s *GHW) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	listings, err := jtlCategories(ctx, f, s.BaseURL(), "?af=50", func(top, name string) bool {
		return ghwSkipTopRe.MatchString(top)
	})
	return listings, nil, err
}

func (s *GHW) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	return jtlParseListing(pageURL, doc, "?af=50")
}

func (s *GHW) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return jtlParseProduct(pageURL, doc)
}
