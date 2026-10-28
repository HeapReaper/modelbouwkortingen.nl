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

// RUDDOG draait op JTL-Shop 5 (NOVA-thema, zie jtl.go), maar de productkaarten hebben geen
// microdata.
//
//   - /Sitemap toont geen categorieën: die komen uit de categoriebox op een categoriepagina. We
//     nemen de onderste categorieën van de bomen per soort; Neuheiten, SALE en de Marken-boom
//     (dezelfde producten per merk) slaan we over.
//   - De bovenste categorie "Baukästen | Ersatzteile" laten we uit de categoriehint, anders
//     worden de bouwdozen ook als onderdeel ingedeeld.
//   - Listings: een JSON-LD ItemList met prijs, voorraad en merk; 100 producten per pagina met
//     ?af=100, paginering via _sN.
//   - Productpagina's bezoeken we niet.
type RUDDOG struct{}

func (*RUDDOG) Slug() string    { return "ruddog" }
func (*RUDDOG) Name() string    { return "RUDDOG" }
func (*RUDDOG) BaseURL() string { return "https://www.ruddog.eu" }
func (*RUDDOG) Description() string {
	return "Duitse RC-importeur met vooral auto-onderdelen en tuning (Team Associated, Avid, Bittydesign), plus regelaars, motoren, accu's en gereedschap."
}

const (
	ruddogQuery   = "?af=100"
	ruddogKitsTop = "Baukästen | Ersatzteile | "
)

var ruddogSkipTopRe = regexp.MustCompile(`(?i)^(neuheiten|sale|marken)$`)

func (s *RUDDOG) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	listings, err := jtlCategoryBox(ctx, f, s.BaseURL()+"/Baukaesten-Ersatzteile", ruddogQuery, func(top, name string) bool {
		return ruddogSkipTopRe.MatchString(top)
	})
	return listings, nil, err
}

func (s *RUDDOG) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	products := ldParseListing(doc)
	for i := range products {
		products[i].CategoryHint = strings.TrimPrefix(products[i].CategoryHint, ruddogKitsTop)
	}
	if len(products) == 0 {
		return products, ""
	}
	return products, jtlNextPage(pageURL, doc, ruddogQuery)
}

func (s *RUDDOG) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return nil
}
