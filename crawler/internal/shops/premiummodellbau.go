package shops

import (
	"context"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Premium-Modellbau draait op Shopware 5 (zie shopware5.go): vooral (zware) multicopters en
// drone-elektronica (Holybro, T-Motor, SIYI, Herelink), plus robotica en funktionsmodellen.
//
//   - robots.txt vraagt Crawl-delay: 5 en verbiedt /listing (de AJAX-listing); de gewone
//     categorie-URL's met ?n= en ?p= mogen wel.
//   - Listings: de onderste categorieën uit de sitemap (~1.900 producten). Overgeslagen: de
//     merkpagina's (één niveau diep, dubbel) en drohnen-dienstleistungen (diensten).
//   - Productpagina's bezoeken we niet: de listings bevatten alle data.
type PremiumModellbau struct{}

func (*PremiumModellbau) Slug() string    { return "premiummodellbau" }
func (*PremiumModellbau) Name() string    { return "Premium-Modellbau" }
func (*PremiumModellbau) BaseURL() string { return "https://www.premium-modellbau.de" }
func (*PremiumModellbau) Description() string {
	return "Duitse dronespecialist met multicopters, flight controllers, GPS, motoren, gimbals en videoverbindingen, plus robotica."
}

func (s *PremiumModellbau) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap.xml", nil)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var categories []string
	for _, u := range urls {
		if strings.HasSuffix(u.Loc, "/") && !strings.HasPrefix(u.Loc, s.BaseURL()+"/drohnen-dienstleistungen/") {
			categories = append(categories, u.Loc)
		}
	}
	var listings []string
	for _, c := range leafCategories(categories, 2) {
		listings = append(listings, c+sw5Query)
	}
	return listings, nil, nil
}

func (s *PremiumModellbau) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	return sw5ParseListing(pageURL, doc)
}

func (s *PremiumModellbau) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return sw5ParseProduct(pageURL, doc)
}
