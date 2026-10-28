package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// De Mikado-shop draait op een eigen systeem.
//
//   - Productpagina's (?a=article&ProdNr=<nr>, ~1.000) uit sitemap.xml, met schema.org-
//     microdata. Een product kan onder meer categorieën staan; het id is het ProdNr.
type Mikado struct{}

func (*Mikado) Slug() string    { return "mikado" }
func (*Mikado) Name() string    { return "Mikado" }
func (*Mikado) BaseURL() string { return "https://shop.mikado-heli.de" }
func (*Mikado) Description() string {
	return "Duitse fabrikant van LOGO-helikopters en VBar/VStabi-elektronica, met heli's, onderdelen, rotorbladen en toebehoren."
}

var (
	mikadoProductRe = regexp.MustCompile(`^https://shop\.mikado-heli\.de/[^?]+\.htm\?a=article&ProdNr=\d+`)
	mikadoIDRe      = regexp.MustCompile(`ProdNr=(\d+)`)
)

func (s *Mikado) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	products, err := ldSitemapProducts(ctx, f, s.BaseURL()+"/sitemap.xml", mikadoProductRe.MatchString)
	return nil, products, err
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Mikado) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *Mikado) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, mikadoIDRe)
	return p
}
