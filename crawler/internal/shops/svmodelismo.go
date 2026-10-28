package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// SV Modelismo draait op PrestaShop.
//
//   - Engelse productpagina's (/gb/<categorie>/<id>-<slug>.html, ~3.300) uit
//     1_index_sitemap.xml; de Portugese kopieën onder /pt/ slaan we over.
type SVModelismo struct{}

func (*SVModelismo) Slug() string    { return "svmodelismo" }
func (*SVModelismo) Name() string    { return "SV Modelismo" }
func (*SVModelismo) BaseURL() string { return "https://www.svmodelismo.net" }
func (*SVModelismo) Description() string {
	return "Portugese modelbouwshop met vliegtuigen, boten, auto's, elektronica, bespanningsfolie en bouwmaterialen."
}

var (
	svmodelismoProductRe = regexp.MustCompile(`^https://www\.svmodelismo\.net/gb/[^/]+/\d+-[^/?]+\.html$`)
	svmodelismoIDRe      = regexp.MustCompile(`/(\d+)-[^/]+\.html$`)
	svmodelismoSkipURLRe = regexp.MustCompile(`/gb/content/`)
)

func (s *SVModelismo) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/1_index_sitemap.xml", func(loc string) bool {
		return svmodelismoProductRe.MatchString(loc) && !svmodelismoSkipURLRe.MatchString(loc)
	})
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *SVModelismo) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *SVModelismo) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, svmodelismoIDRe)
	if p == nil {
		return nil
	}
	if len(p.Breadcrumbs) == 0 {
		doc.Find(`.breadcrumb [itemprop="title"]`).Each(func(_ int, s *goquery.Selection) {
			if t := parse.Clean(s.Text()); t != "" {
				p.Breadcrumbs = append(p.Breadcrumbs, t)
			}
		})
	}
	// Voorraad: label-success is op voorraad; label-warning (nabestellen) en label-danger niet.
	if p.InStock == nil {
		if v := doc.Find("#availability_value"); v.Length() > 0 {
			in := v.HasClass("label-success")
			p.InStock = &in
		}
	}
	return p
}
