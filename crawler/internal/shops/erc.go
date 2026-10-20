package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// ERC (e-rc.be, Goeferdinge, België) is een kleine helikopterspecialist op PrestaShop (~300
// producten, Engelse namen). Alles komt uit de JSON-listing van de hoofdcategorie (zie
// prestashop.go), 4 pagina's. Bijna alles is voor helikopters (Goosky, JR, rotorbladen). De
// categorieën heten vaak alleen naar het model ("Goosky S2"), dus de hint is "heli parts", of
// "helicopter" voor de complete heli's (ercModelRe).
type ERC struct{}

func (*ERC) Slug() string    { return "erc" }
func (*ERC) Name() string    { return "e-rc" }
func (*ERC) BaseURL() string { return "https://www.e-rc.be" }
func (*ERC) Description() string {
	return "Belgische helikopterspecialist met Goosky-heli's, rotorbladen, onderdelen, servo's, gyro's en laders."
}

func (s *ERC) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := psSeeds(ctx, f, psFeed(s.BaseURL()+"/2-home"))
	return seeds, nil, err
}

func (s *ERC) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	products, next := parsePSListing(pageURL, body, nil)
	for i := range products {
		products[i].CategoryHint = "heli parts"
		if ercModelRe.MatchString(products[i].Name) {
			products[i].CategoryHint = "helicopter"
		}
	}
	return products, next
}

// ercModelRe herkent complete heli's ("Goosky S2 BNF"); de categorieën daarvan heten alleen
// naar het model ("S2", "RS4"). "kit" telt alleen aan het eind: "(Venom kit version)" is een
// onderdeel.
var ercModelRe = regexp.MustCompile(`(?i)\b(bnf|rtf|pnp|combo)\b|\bkit$`)

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *ERC) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *ERC) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
