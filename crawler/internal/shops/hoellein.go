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

// Hoellein draait op Shopify (zie shopify.go).
//
//   - Listings: de openbare feed /products.json.
//   - Productpagina's: /sitemap.xml → sitemap_products_N.xml (alleen de Duitse, niet /en/).
//     De pagina bevat JSON-LD (Product) en het Shopify product-id in de analytics-data.
type Hoellein struct{}

func (*Hoellein) Slug() string    { return "hoellein" }
func (*Hoellein) Name() string    { return "Hoellein" }
func (*Hoellein) BaseURL() string { return "https://hoelleinshop.com" }
func (*Hoellein) Description() string {
	return "Duitse modelvliegspecialist met motoren, regelaars, servo's, propellers en bouwmaterialen."
}

// Cookie: zonder Nederlandse markt geeft Shopify prijzen met 19% Duitse btw (zie vat.go).
func (*Hoellein) Cookie() string { return shopifyNLCookie }

func (*Hoellein) UserAgent() string { return shopifyUserAgent }

func (*Hoellein) MinDelay() time.Duration { return 2 * time.Second } // bij 1 s kwamen er 429/503's

// Productpagina's zijn alleen een terugvaloptie: /products.json bevat alle prijzen al.
func (*Hoellein) MaxProductPages() int { return 300 }

func (s *Hoellein) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	follow := func(u string) bool {
		return strings.Contains(u, "/sitemap_products_") && !strings.Contains(u, ".com/en/")
	}
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
func (s *Hoellein) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	// interne tags als "dim_calculated" zeggen niets over de categorie
	return parseShopifyFeed(s.BaseURL(), pageURL, body, func(t string) bool { return !strings.HasPrefix(t, "dim_") })
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *Hoellein) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Hoellein) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	ld, _ := parse.JSONLD(doc)
	if ld == nil {
		return nil
	}
	html, _ := doc.Html()
	m := shopifyProductIDRe.FindStringSubmatch(html)
	if m == nil {
		return nil
	}
	p := &parse.Product{
		ExternalID: m[1],
		URL:        firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:       ld.Name,
		SKU:        ld.SKU,
		Brand:      ld.Brand,
		ImageURL:   firstNonEmpty(parse.MetaContent(doc, "og:image"), ld.Image),
		Price:      ld.Price,
		InStock:    parse.Availability(ld.Availability),
	}
	if p.Price == 0 {
		p.Price = parse.Price(parse.MetaContent(doc, "og:price:amount"))
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
