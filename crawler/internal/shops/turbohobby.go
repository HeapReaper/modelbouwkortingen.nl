package shops

import (
	"context"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// TurboHobby draait op PrestaShop 1.7, maar de JSON-listing van dit thema bevat geen
// productgegevens (alleen HTML).
//
//   - Productpagina's (URL's op .html, ~4.300) uit 1_index_sitemap.xml met een JSON-LD Product; het kruimelpad komt uit het inline prestashop-object.
//     Elektrische steps en speelgoed slaan we over.
type TurboHobby struct{}

func (*TurboHobby) Slug() string    { return "turbohobby" }
func (*TurboHobby) Name() string    { return "TurboHobby" }
func (*TurboHobby) BaseURL() string { return "https://turbohobby.com" }
func (*TurboHobby) Description() string {
	return "Spaanse RC-shop met auto's (HSP, Team Magic), boten, vliegtuigen en heli's, plus veel onderdelen, accu's, laders en gereedschap."
}

var (
	turbohobbyProductRe = regexp.MustCompile(`^https://turbohobby\.com/[^?]+\.html$`)
	turbohobbySkipRe    = regexp.MustCompile(`(?i)patinete|scooter|hoverboard|juguete`)
)

func (s *TurboHobby) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/1_index_sitemap.xml", turbohobbyProductRe.MatchString)
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *TurboHobby) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *TurboHobby) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, nil)
	if p != nil && len(p.Breadcrumbs) == 0 {
		p.Breadcrumbs = psBreadcrumbs(doc)
	}
	if p == nil || turbohobbySkipRe.MatchString(strings.Join(append(p.Breadcrumbs, p.Name), " | ")) {
		return nil
	}
	return p
}

// TLS12: de server maakt de TLS 1.3-handshake van Go niet af.
func (*TurboHobby) TLS12() {}
