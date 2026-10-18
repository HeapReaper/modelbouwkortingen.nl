package shops

import (
	"context"
	"regexp"
	"strconv"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Voltmaster draait op JTL-Shop 5 (NOVA-thema, zie jtl.go).
//
//   - Categorieën uit /Sitemap. Bovenliggende categorieën tonen geen producten, alleen hun
//     subcategorieën; die kosten één request per ronde. Overgeslagen: de "Nach Hersteller"-
//     en "Unsortiert"-merkenlijsten (dubbel), de Akku-/ServoFinder, 3D-print-artikelen,
//     speelgoed, cadeaubonnen en de Sale-lijst.
//   - Listings: 50 producten per pagina met ?af=50, paginering via <categorie>_s2, ...
//   - Productpagina's bezoeken we niet: de listings bevatten alle data.
type Voltmaster struct{}

func (*Voltmaster) Slug() string    { return "voltmaster" }
func (*Voltmaster) Name() string    { return "Voltmaster" }
func (*Voltmaster) BaseURL() string { return "https://www.voltmaster.de" }
func (*Voltmaster) Description() string {
	return "Duitse RC-shop met vliegtuigen, zwevers, auto's en boten, plus veel accu's, laders, motoren, regelaars en servo's."
}

const voltmasterPerPage = 50

var voltmasterQuery = "?af=" + strconv.Itoa(voltmasterPerPage)

var (
	voltmasterSkipTopRe  = regexp.MustCompile(`(?i)^(3d print|unsortiert|sale|gutscheine)\b`)
	voltmasterSkipNameRe = regexp.MustCompile(`(?i)^(nach hersteller|akkufinder|servofinder|spielwaren)$`)
)

func (s *Voltmaster) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	listings, err := jtlCategories(ctx, f, s.BaseURL(), voltmasterQuery, func(top, name string) bool {
		return voltmasterSkipTopRe.MatchString(top) || voltmasterSkipNameRe.MatchString(name)
	})
	return listings, nil, err
}

func (s *Voltmaster) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	return jtlParseListing(pageURL, doc, voltmasterQuery)
}

func (s *Voltmaster) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return jtlParseProduct(pageURL, doc)
}
