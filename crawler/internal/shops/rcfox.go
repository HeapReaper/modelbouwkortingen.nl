package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// RCFOX draait op JTL-Shop 5 met een eigen thema; de NOVA-selectors uit jtl.go passen niet.
//
//   - /Sitemap toont geen categorieën: die komen uit het megamenu op de homepage. Per
//     menukolom nemen we de subcategorieën, of de kolom zelf als die geen subcategorieën heeft.
//     Bovenliggende categorieën tonen ook alle producten van hun subcategorieën, dus die slaan we
//     over. Ook overgeslagen: merchandise, kleding, spellen, slotracing, plastic bouwdozen,
//     standmodellen, brandstof en de merkenlijst.
//   - Listings: een JSON-LD ItemList met ~60 producten per pagina (prijs, voorraad, merk).
//     robots.txt verbiedt ?af=, dus we blijven op het standaardaantal; paginering via _sN.
//   - Productpagina's bezoeken we niet.
type RCFOX struct{}

func (*RCFOX) Slug() string    { return "rcfox" }
func (*RCFOX) Name() string    { return "RCFOX" }
func (*RCFOX) BaseURL() string { return "https://www.rcfox.de" }
func (*RCFOX) Description() string {
	return "Grote Duitse RC-shop met auto's, trucks, vliegtuigen, heli's en boten, en heel veel onderdelen per merk, elektronica en gereedschap."
}

var (
	rcfoxSkipTopRe  = regexp.MustCompile(`(?i)^(merchandise|hobby|marken)`)
	rcfoxSkipNameRe = regexp.MustCompile(`(?i)^(merchandise|kleidung|kopfbedeckung|werbemittel|freizeitspiele|slot racing|plastikmodellbau|standmodelle|nitro kraftstoff|marken)$`)
)

func (s *RCFOX) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	doc, _, err := fetchDoc(ctx, f, s.BaseURL()+"/")
	if err != nil {
		return nil, nil, err
	}
	var out []string
	doc.Find("li.slpx-navbar-item").Each(func(_ int, top *goquery.Selection) {
		if rcfoxSkipTopRe.MatchString(parse.Clean(attr(top.Find("a.slpx-navbar-link").First(), "aria-label"))) {
			return
		}
		top.Find(".mega-menu-item").Each(func(_ int, col *goquery.Selection) {
			head := col.Find("a.mega-menu-category-name").First()
			if rcfoxSkipNameRe.MatchString(parse.Clean(head.Text())) {
				return
			}
			children := col.Find("a.mega-menu-category-child-link")
			if children.Length() == 0 {
				out = append(out, stripQuery(attr(head, "href")))
				return
			}
			children.Each(func(_ int, a *goquery.Selection) {
				if !rcfoxSkipNameRe.MatchString(parse.Clean(a.Text())) {
					out = append(out, stripQuery(attr(a, "href")))
				}
			})
		})
	})
	return dedupe(out), nil, nil
}

func (s *RCFOX) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	products := ldParseListing(doc)
	if len(products) == 0 {
		return products, ""
	}
	return products, jtlNextPage(pageURL, doc, "")
}

func (s *RCFOX) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return nil
}
