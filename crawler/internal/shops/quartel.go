package shops

import (
	"context"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Quartel (Pijnacker) draait op WooCommerce, maar de Store API geeft een 403. De
// productpagina's komen daarom uit de Yoast-sitemaps (product-sitemapN.xml) en de gegevens uit
// het JSON-LD-blok van Yoast WooCommerce SEO (zie jsonld.go): prijs in priceSpecification,
// voorraad als tekst ("6 op voorraad", "Niet op voorraad"). Bij ~30.000 producten is niet elk
// product elke ronde aan de beurt.
type Quartel struct{}

func (*Quartel) Slug() string    { return "quartel" }
func (*Quartel) Name() string    { return "Quartel" }
func (*Quartel) BaseURL() string { return "https://quartel.nl" }
func (*Quartel) Description() string {
	return "Modelbouwwinkel in Pijnacker (sinds 1970) met RC-auto's, vliegtuigen, heli's en boten, plus onderdelen, brandstof, accu's en gereedschap."
}

func (*Quartel) UserAgent() string { return "" }

func (*Quartel) MinDelay() time.Duration { return 2 * time.Second }

func (s *Quartel) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/sitemap_index.xml", func(u string) bool {
		return strings.Contains(u, "/product/")
	})
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Quartel) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Quartel) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, nil)
	if p == nil {
		return nil
	}
	ld, _ := parse.JSONLD(doc)
	stock := strings.ToLower(ld.Availability)
	in := strings.Contains(stock, "op voorraad") && !strings.Contains(stock, "niet")
	p.InStock = &in
	// De breadcrumbs zijn alleen "Shop"; de categorie staat onder het product als link naar
	// /product-category/vliegtuigen/toebehoren-vliegtuigen/.
	p.Breadcrumbs = nil
	doc.Find(".posted_in a[href]").Each(func(_ int, a *goquery.Selection) {
		_, path, ok := strings.Cut(attr(a, "href"), "/product-category/")
		if !ok {
			return
		}
		for _, seg := range strings.Split(strings.Trim(path, "/"), "/") {
			p.Breadcrumbs = append(p.Breadcrumbs, strings.ReplaceAll(seg, "-", " "))
		}
	})
	return p
}
