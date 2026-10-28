package shops

import (
	"context"
	"regexp"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Monster-Hopups draait op JTL-Shop 5 (NOVA-thema, zie jtl.go). Categorieën uit /Sitemap, zonder
// de merkenbomen (Arrma, Axial, Losi, Spektrum, Traxxas: dubbel met de gewone categorieën) de
// infopagina's, kleding en cadeaus. Listings met ?af=50; robots.txt vraagt 5 seconden tussen
// requests.
type MonsterHopups struct{}

func (*MonsterHopups) Slug() string    { return "monsterhopups" }
func (*MonsterHopups) Name() string    { return "Monster-Hopups" }
func (*MonsterHopups) BaseURL() string { return "https://www.monsterhopups.de" }
func (*MonsterHopups) Description() string {
	return "Duitse RC-shop met vooral auto's en trucks van Traxxas, Arrma, Axial en Losi, plus onderdelen, tuning, boten en vliegtuigen."
}

func (*MonsterHopups) UserAgent() string { return "" }

func (*MonsterHopups) MinDelay() time.Duration { return 5 * time.Second }

var monsterhopupsSkipTopRe = regexp.MustCompile(`(?i)^(arrma|axial|losi|spektrum|traxxas|bewertungen|datenschutz|facebook|impressum|instagram|karriere|youtube|über uns|autumn weeks)\b`)

var monsterhopupsSkipNameRe = regexp.MustCompile(`(?i)^(bekleidung|geschenke|was in rc-schrauben)`)

func (s *MonsterHopups) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	listings, err := jtlCategories(ctx, f, s.BaseURL(), "?af=50", func(top, name string) bool {
		return monsterhopupsSkipTopRe.MatchString(top) || monsterhopupsSkipNameRe.MatchString(name)
	})
	return listings, nil, err
}

func (s *MonsterHopups) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	return jtlParseListing(pageURL, doc, "?af=50")
}

func (s *MonsterHopups) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return jtlParseProduct(pageURL, doc)
}
