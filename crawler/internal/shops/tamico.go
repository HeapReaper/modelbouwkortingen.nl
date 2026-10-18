package shops

import (
	"context"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Tamico draait op JTL-Shop 5 (NOVA-thema, zie jtl.go).
//
//   - robots.txt vraagt Crawl-delay: 5. De XML-sitemap (gzip-bestanden, ~42.000 URL's) bevat elk
//     product in het Duits én Engels met hetzelfde artikelnummer; we bezoeken daarom geen
//     productpagina's, de listings bevatten alle data al (~1.000 requests per ronde).
//   - Categorieën: de HTML-sitemap /Sitemap ("Alle Kategorien") geeft elke categorie met de
//     hoofdcategorie in het title-attribuut. We nemen alle subcategorieën, behalve de
//     "Neu 2026-xx"-lijsten en de SALE-groep: die tonen alleen dubbele producten en zouden
//     als eerste waarneming een nietszeggende categorie opleveren.
//   - Listings: 50 producten per pagina met ?af=50, paginering via <categorie>_s2, _s3, ...
//     Elke productkaart heeft schema.org-microdata (naam, sku, merk, prijs, availability) en
//     het artikelnummer in <input name="a">. Een "statt"-prijs staat niet op de listings.
//   - Productpagina's (alleen voor parsecheck): het hoofdproduct staat in #result-wrapper,
//     het artikelnummer in input.current_article, breadcrumbs als BreadcrumbList-microdata.
type Tamico struct{}

func (*Tamico) Slug() string    { return "tamico" }
func (*Tamico) Name() string    { return "Tamico" }
func (*Tamico) BaseURL() string { return "https://tamico.de" }
func (*Tamico) Description() string {
	return "Duitse RC-car-specialist met veel Tamiya, Kyosho en Traxxas, plus trucks, tanks en een enorm onderdelenassortiment."
}

const tamicoPerPage = 50

var tamicoSkipCategoryRe = regexp.MustCompile(`(?i)^(neu\b|neu-|vorbestellen)`)

var tamicoQuery = "?af=" + strconv.Itoa(tamicoPerPage)

func (s *Tamico) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	listings, err := jtlCategories(ctx, f, s.BaseURL(), tamicoQuery, func(top, name string) bool {
		return strings.Contains(top, "SALE") || tamicoSkipCategoryRe.MatchString(name)
	})
	return listings, nil, err
}

func (s *Tamico) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	return jtlParseListing(pageURL, doc, tamicoQuery)
}

func (s *Tamico) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return jtlParseProduct(pageURL, doc)
}
