package shops

import (
	"context"
	"regexp"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Bauer Modelle draait op Shopware 6 (zie shopware6.go).
//
//   - Categorieën: de onderste categorieën uit de sitemap, zonder de footerpagina's, catalogi en
//     figuren.
//   - Listings: 100 producten per pagina met ?limit=100, paginering via ?p=N. De kaarten hebben
//     geen bestelknop, alleen "Details"; voorraad uit het statusbolletje.
//   - Productpagina's bezoeken we niet.
type Bauer struct{}

func (*Bauer) Slug() string    { return "bauer" }
func (*Bauer) Name() string    { return "Bauer Modelle" }
func (*Bauer) BaseURL() string { return "https://www.bauer-modelle.com" }
func (*Bauer) Description() string {
	return "Duitse specialist in RC-schepen: bouwdozen, beslag, schroeven en asaandrijvingen, plus motoren, regelaars, verlichting en materialen."
}

var bauerSkipRe = regexp.MustCompile(`^(Footer|Kataloge|Figuren)/`)

func (s *Bauer) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	listings, err := sw6SitemapCategories(ctx, f, s.BaseURL()+"/sitemap.xml", s.BaseURL(), "?limit=100", bauerSkipRe.MatchString)
	return listings, nil, err
}

func (s *Bauer) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	return sw6ParseListing(pageURL, doc, nil, true)
}

func (s *Bauer) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return sw6ParseProduct(pageURL, doc)
}
