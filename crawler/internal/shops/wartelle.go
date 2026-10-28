package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Wartelle draait op WiziShop.
//
//   - Productpagina's (URL's op -c2x<id>, ~20.000) uit Sitemap.asp; per ronde komt een deel aan
//     de beurt (zie CRAWLER_MAX_PRODUCT_PAGES). Categoriepagina's eindigen op -c102x<id> en
//     slaan we over. De breadcrumbs (zonder "Tous les articles") komen uit ul.catbreadcrumb.
type Wartelle struct{}

func (*Wartelle) Slug() string    { return "wartelle" }
func (*Wartelle) Name() string    { return "Wartelle Shop" }
func (*Wartelle) BaseURL() string { return "https://www.wartelle-shop.com" }
func (*Wartelle) Description() string {
	return "Franse RC-shop met auto's, buggy's en crawlers en een groot aanbod onderdelen en tuning."
}

var (
	wartelleProductRe = regexp.MustCompile(`^https://www\.wartelle-shop\.com/[^/?]+-c2x\d+$`)
	wartelleIDRe      = regexp.MustCompile(`-c2x(\d+)$`)
)

func (s *Wartelle) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/Sitemap.asp?AccID=132405&LangID=0", wartelleProductRe.MatchString)
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Wartelle) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Wartelle) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, wartelleIDRe)
	if p != nil && len(p.Breadcrumbs) == 0 {
		doc.Find("ul.catbreadcrumb li.catbcname a").Each(func(_ int, a *goquery.Selection) {
			if t := parse.Clean(a.Text()); t != "" {
				p.Breadcrumbs = append(p.Breadcrumbs, t)
			}
		})
	}
	return p
}
