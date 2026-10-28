package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Verspaget draait op OpenCart.
//
//   - Productpagina's (/<slug>, ~4.700) uit sitemap.xml, met een JSON-LD Product. Categorieën
//     staan een niveau dieper (/<categorie>/<sub>) en slaan we over. Het id is de slug: de SKU
//     is soms een omschrijving.
type Verspaget struct{}

func (*Verspaget) Slug() string    { return "verspaget" }
func (*Verspaget) Name() string    { return "Verspaget Modelbouw" }
func (*Verspaget) BaseURL() string { return "https://www.verspaget.nl" }
func (*Verspaget) Description() string {
	return "Modelbouwwinkel uit Eindhoven met RC-auto's, bouwdozen, verf en veel onderdelen."
}

var (
	verspagetProductRe = regexp.MustCompile(`^https://www\.verspaget\.nl/[^/?]+$`)
	verspagetIDRe      = regexp.MustCompile(`^https://www\.verspaget\.nl/([^/?]+)$`)
)

func (s *Verspaget) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/sitemap.xml", verspagetProductRe.MatchString)
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Verspaget) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Verspaget) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, verspagetIDRe)
	return p
}
