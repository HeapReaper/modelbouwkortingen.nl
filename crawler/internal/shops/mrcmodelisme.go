package shops

import (
	"context"
	"net/url"
	"regexp"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// MRCModelisme (Frankrijk) draait op WooCommerce. Alle ~11.000 producten komen uit de Store
// API (zie woocommerce.go), ~110 pagina's. Productnamen zijn Frans (zie src/lib/translate.ts);
// brandstof (Carburants) slaan we over. Onderdelen staan ook in de categorieën van de modellen
// waar ze op passen; die tellen niet mee voor de indeling (mrcModelCategoryRe).
type MRCModelisme struct{}

func (*MRCModelisme) Slug() string    { return "mrcmodelisme" }
func (*MRCModelisme) Name() string    { return "MRC Modélisme" }
func (*MRCModelisme) BaseURL() string { return "https://www.mrcmodelisme.com" }
func (*MRCModelisme) Description() string {
	return "Franse modelbouwwinkel met veel Traxxas- en Kavan-onderdelen, plus auto's, vliegtuigen, boten, accu's en elektronica."
}

func (*MRCModelisme) UserAgent() string { return "" }

// MinDelay: geen Crawl-delay in robots.txt, maar elke pagina komt uit WordPress.
func (*MRCModelisme) MinDelay() time.Duration { return 2 * time.Second }

func (s *MRCModelisme) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{}))
	return seeds, nil, err
}

func (s *MRCModelisme) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseWooFeed(pageURL, body, func(cats []string) bool { return wooHasCategory(cats, "carburant") },
		func(c string) bool { return !mrcModelCategoryRe.MatchString(c) })
}

// mrcModelCategoryRe herkent de categorieën per model ("4-Tec Drift - 4x4 - 1/10"). Een
// onderdeel staat in tientallen daarvan; zonder dit filter zou "Drift" of "Monster Truck" in
// zo'n naam het als auto indelen.
var mrcModelCategoryRe = regexp.MustCompile(`(?i)\d\s*x\s*\d|1/\d`)

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *MRCModelisme) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *MRCModelisme) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
