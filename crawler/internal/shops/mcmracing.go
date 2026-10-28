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

// MCM Racing draait op PrestaShop 1.6 (zonder JSON-listing).
//
//   - Nederlandstalige productpagina's (/nl/<categorie>/<id>-<slug>, ~104.000) uit
//     de Nederlandse sitemaps uit 1_index_sitemap.xml, met JSON-LD of microdata. robots.txt vraagt 10 seconden tussen
//     verzoeken, dus een ronde van CRAWLER_MAX_PRODUCT_PAGES pagina's duurt uren en elk product
//     komt maar af en toe aan de beurt.
type MCMRacing struct{}

func (*MCMRacing) Slug() string    { return "mcmracing" }
func (*MCMRacing) Name() string    { return "MCM Racing" }
func (*MCMRacing) BaseURL() string { return "https://www.mcmracing.com" }
func (*MCMRacing) Description() string {
	return "Belgische RC-shop met auto's, heli's, vliegtuigen en drones en een zeer groot aanbod onderdelen."
}

var (
	mcmracingProductRe = regexp.MustCompile(`^https://www\.mcmracing\.com/nl/[^/]+/\d+-[^/?]+$`)
	mcmracingIDRe      = regexp.MustCompile(`/nl/[^/]+/(\d+)-`)
)

func (s *MCMRacing) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	// Alleen de Nederlandse sub-sitemaps (1_nl_<n>_sitemap.xml): de index noemt er 80 en elke
	// kost 10 seconden.
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/1_index_sitemap.xml", func(loc string) bool {
		return strings.Contains(loc, "/1_nl_")
	})
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var products []sitemap.URL
	for _, u := range urls {
		if mcmracingProductRe.MatchString(u.Loc) {
			products = append(products, u)
		}
	}
	return nil, products, nil
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *MCMRacing) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *MCMRacing) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := ldParseProduct(pageURL, doc, mcmracingIDRe)
	return p
}
