package shops

import (
	"context"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/fetch"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/sitemap"
)

// RCMotorsports draait op Shopify (zie shopify.go).
//
//   - Listings: de openbare feed /products.json (ruim 10.000 producten).
//   - Productpagina's: /sitemap.xml → sitemap_products_N.xml. Er is geen JSON-LD; de pagina
//     heeft schema.org-microdata (itemprop) en het Shopify product-id in de analytics-data.
type RCMotorsports struct{}

func (*RCMotorsports) Slug() string    { return "rcmotorsports" }
func (*RCMotorsports) Name() string    { return "RC Motorsports" }
func (*RCMotorsports) BaseURL() string { return "https://www.rcmotorsports.nl" }
func (*RCMotorsports) Description() string {
	return "RC-dealer in Nieuwerkerk aan den IJssel met o.a. Traxxas, Arrma, Axial en Tamiya, plus veel onderdelen."
}

func (*RCMotorsports) UserAgent() string { return shopifyUserAgent }

func (*RCMotorsports) MinDelay() time.Duration { return time.Second }

// Productpagina's zijn alleen een terugvaloptie: /products.json bevat alle prijzen al.
func (*RCMotorsports) MaxProductPages() int { return 300 }

func (s *RCMotorsports) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	follow := func(u string) bool { return strings.Contains(u, "/sitemap_products_") }
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap.xml", follow)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var products []sitemap.URL
	for _, u := range urls {
		if strings.Contains(u.Loc, "/products/") {
			products = append(products, u)
		}
	}
	return shopifyFeedSeeds(s.BaseURL()), products, nil
}

// ParseListingRaw leest een pagina van /products.json.
func (s *RCMotorsports) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseShopifyFeed(s.BaseURL(), pageURL, body, nil)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *RCMotorsports) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *RCMotorsports) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	item := doc.Find(`[itemscope][itemtype$="schema.org/Product"]`).First()
	if item.Length() == 0 {
		return nil
	}
	html, _ := doc.Html()
	m := shopifyProductIDRe.FindStringSubmatch(html)
	if m == nil {
		return nil
	}
	prop := func(sel *goquery.Selection, name string) string {
		return attr(sel.Find(`[itemprop="`+name+`"]`).First(), "content")
	}
	offers := item.Find(`[itemprop="offers"]`).First()
	p := &parse.Product{
		ExternalID: m[1],
		URL:        firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:       parse.Clean(prop(item, "name")),
		SKU:        prop(item, "sku"),
		Brand:      parse.Clean(prop(item, "brand")),
		ImageURL:   firstNonEmpty(parse.MetaContent(doc, "og:image:secure_url"), prop(item, "image")),
		Price:      parse.Price(prop(offers, "price")),
		InStock:    parse.Availability(attr(offers.Find(`[itemprop="availability"]`).First(), "href")),
	}
	if p.Price == 0 {
		p.Price = parse.Price(parse.MetaContent(doc, "og:price:amount"))
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
