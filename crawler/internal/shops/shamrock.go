package shops

import (
	"context"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Shamrock Modelbouw draait op Shopware 6 (zie shopware6.go).
//
//   - Categorieën: de onderste categorieën onder /Producten/ uit de sitemap. Overgeslagen:
//     Support (onderdelen per Traxxas-model, dubbel met de onderdelencategorieën), houten en
//     plastic bouwpakketten, verf, speelgoed, treinen, die-cast, brandstof, occasions en
//     cadeaubonnen.
//   - Listings: 100 producten per pagina met ?limit=100, paginering via ?p=N. De kaarten tonen
//     geen voorraad.
//   - Productpagina's bezoeken we niet.
type Shamrock struct{}

func (*Shamrock) Slug() string    { return "shamrock" }
func (*Shamrock) Name() string    { return "Shamrock Modelbouw" }
func (*Shamrock) BaseURL() string { return "https://shamrock-modelbouw.nl" }
func (*Shamrock) Description() string {
	return "Modelbouwwinkel in Maastricht (sinds 1972) met RC-auto's en veel onderdelen (Traxxas, Tamiya, Kyosho, Arrma, HPI), plus vliegtuigen, boten, accu's en zenders."
}

var shamrockSkipRe = regexp.MustCompile(`^Producten/(Support|Houten-Bouwpakketten|Plastic-Modelbouw|Speelgoed|Treinen|Die-Cast|Brandstof|Occasion|Cadeaubonnen|Accessoires/Verf|Auto-s/Verf)/`)

func (s *Shamrock) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	listings, err := sw6SitemapCategories(ctx, f, s.BaseURL()+"/sitemap.xml", s.BaseURL(), "?limit=100", func(path string) bool {
		return !strings.HasPrefix(path, "Producten/") || shamrockSkipRe.MatchString(path)
	})
	return listings, nil, err
}

func (s *Shamrock) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	return sw6ParseListing(pageURL, doc, nil)
}

func (s *Shamrock) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return sw6ParseProduct(pageURL, doc)
}
