package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// ModelVigo draait op PrestaShop.
//
//   - Productpagina's (/<categorie>/<id>-<slug>.html, ~2.200) uit 1_index_sitemap.xml. robots.txt
//     verwijst naar een kopie op modelvigo.gruposicom.com, maar die host verbiedt crawlen. De
//     sitemap is oud: verhuisde producten volgen we via de canonieke URL.
type ModelVigo struct{}

func (*ModelVigo) Slug() string    { return "modelvigo" }
func (*ModelVigo) Name() string    { return "ModelVigo" }
func (*ModelVigo) BaseURL() string { return "https://www.modelvigo.es" }
func (*ModelVigo) Description() string {
	return "Spaanse RC-shop met vooral onderdelen voor nitro- en elektrische auto's, plus olie, gereedschap en elektronica."
}

var (
	modelvigoProductRe = regexp.MustCompile(`^https://www\.modelvigo\.es/[^/]+/\d+-[^/?]+\.html$`)
	modelvigoIDRe      = regexp.MustCompile(`/(\d+)-[^/]+\.html$`)
)

func (s *ModelVigo) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/1_index_sitemap.xml", modelvigoProductRe.MatchString)
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *ModelVigo) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *ModelVigo) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, modelvigoIDRe)
	return p
}
