package shops

import (
	"context"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// D-Edition draait op Shopware 6 (zie shopware6.go).
//
//   - Categorieën: de onderste categorieën van het menu "RC Produkte", plus "Modellbau Werkzeug
//     & Klebstoffe". De sitemap onderscheidt categorieën niet van producten; de rest van het
//     menu is plastic modelbouw, die-cast, speelgoed en een merkenboom (dubbel).
//   - Listings: 100 producten per pagina met ?limit=100, paginering via ?p=N. De kaarten hebben
//     alleen een "Details"-knop en tonen geen voorraad.
//   - Productpagina's bezoeken we niet.
type DEdition struct{}

func (*DEdition) Slug() string    { return "dedition" }
func (*DEdition) Name() string    { return "D-Edition" }
func (*DEdition) BaseURL() string { return "https://www.d-edition.de" }
func (*DEdition) Description() string {
	return "Duitse modelbouw- en speelgoedwinkel met RC-auto's, trucks, tanks, vliegtuigen en boten, en veel onderdelen per merk en model."
}

func (s *DEdition) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	listings, err := sw6NavCategories(ctx, f, s.BaseURL()+"/", "?limit=100", func(top, name string) bool {
		return top != "RC Produkte" && name != "Modellbau Werkzeug & Klebstoffe"
	})
	return listings, nil, err
}

func (s *DEdition) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	return sw6ParseListing(pageURL, doc, nil, true)
}

func (s *DEdition) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return sw6ParseProduct(pageURL, doc)
}
