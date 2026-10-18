package shops

import (
	"context"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// CopterFarm draait op Shopware 5 (zie shopware5.go): een kleine FPV-shop (~450 producten).
//
//   - Listings: de onderste categorieën uit de sitemap. Overgeslagen: de merkpagina's en de
//     /marken/-boom (dubbel) en kleding (/fpv-zubehoer/swag-kleidung/).
//   - Productpagina's bezoeken we niet: de listings bevatten alle data.
type CopterFarm struct{}

func (*CopterFarm) Slug() string    { return "copterfarm" }
func (*CopterFarm) Name() string    { return "CopterFarm" }
func (*CopterFarm) BaseURL() string { return "https://www.copterfarm.de" }
func (*CopterFarm) Description() string {
	return "Duitse FPV-shop met frames, motoren, regelaars, flight controllers, videobrillen, accu's en propellers."
}

func (s *CopterFarm) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap_index.xml", nil)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var categories []string
	for _, u := range urls {
		if strings.HasSuffix(u.Loc, "/") && !strings.HasPrefix(u.Loc, s.BaseURL()+"/marken/") &&
			!strings.Contains(u.Loc, "/swag-kleidung/") {
			categories = append(categories, u.Loc)
		}
	}
	var listings []string
	for _, c := range leafCategories(categories, 2) {
		listings = append(listings, c+sw5Query)
	}
	return listings, nil, nil
}

func (s *CopterFarm) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	return sw5ParseListing(pageURL, doc)
}

func (s *CopterFarm) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return sw5ParseProduct(pageURL, doc)
}
