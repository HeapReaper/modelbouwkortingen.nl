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

// Hepf (Oostenrijk) draait op JTL-Shop 5 (NOVA-thema, zie jtl.go).
//
//   - robots.txt verbiedt ?af= (aantal per pagina), dus 24 producten per pagina via _s2, _s3, ...
//   - De XML-sitemap (gzip, ~87.000 URL's) bevat ook het productarchief; we gebruiken alleen de
//     categorieën uit /Sitemap. Overgeslagen: het productarchief en niet-RC-speelgoed en
//     -merchandise (Carrera, Magic Traxx, knuffels, vliegers, kleding, kantoor/IT).
//   - Productpagina's bezoeken we niet: de listings bevatten alle data.
type Hepf struct{}

func (*Hepf) Slug() string    { return "hepf" }
func (*Hepf) Name() string    { return "Hepf" }
func (*Hepf) BaseURL() string { return "https://hepf.com" }
func (*Hepf) Description() string {
	return "Oostenrijkse modelvliegspecialist met vliegtuigen, zwevers, jets en turbines, plus heli's, RC-auto's en elektronica."
}

var hepfSkipRe = regexp.MustCompile(`(?i)^(carrera|magic traxx|pull back|spielzeug|tiere|windspiele|ugears|standmodelle|verschiedenes|merchandise|bekleidung|geschäftsausstattung|it)\b`)

func (s *Hepf) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	listings, err := jtlCategories(ctx, f, s.BaseURL(), "", func(top, name string) bool {
		return strings.EqualFold(top, "Produkt-Archiv") || hepfSkipRe.MatchString(name)
	})
	return listings, nil, err
}

func (s *Hepf) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	return jtlParseListing(pageURL, doc, "")
}

func (s *Hepf) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return jtlParseProduct(pageURL, doc)
}
