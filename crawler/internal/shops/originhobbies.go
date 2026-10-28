package shops

import (
	"context"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// OriginHobbies (Espoo, Finland) is een helikopterspecialist op WooCommerce (WordPress.com) met
// OMPHobby, SAB, Tron, Flywing en Radiomaster. Alle ~3.000 producten komen uit de Store API
// (zie woocommerce.go), ~30 pagina's; robots.txt vraagt een Crawl-delay van 30 s, een ronde
// duurt dus een kwartier. Prijzen zijn inclusief btw en gelden voor alle EU-landen. De
// motorcategorieën per klasse ("Micro Class Helicopter Motors", "Airplane Motors") tellen niet
// mee voor de indeling: die zouden motoren als heli of vliegtuig indelen; "Motors" blijft over.
type OriginHobbies struct{}

func (*OriginHobbies) Slug() string    { return "originhobbies" }
func (*OriginHobbies) Name() string    { return "OriginHobbies" }
func (*OriginHobbies) BaseURL() string { return "https://originhobbies.com" }
func (*OriginHobbies) Description() string {
	return "Finse helikopterspecialist met OMPHobby-, SAB-, Tron- en Flywing-heli's en veel onderdelen, plus Radiomaster-zenders, motoren en accu's."
}

func (*OriginHobbies) UserAgent() string { return "" }

// MinDelay: de Crawl-delay van 30 s uit robots.txt gaat hier toch boven (de fetcher houdt zich daaraan).
func (*OriginHobbies) MinDelay() time.Duration { return 2 * time.Second }

func (s *OriginHobbies) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := wooSeeds(ctx, f, wooFeed(s.BaseURL(), url.Values{}))
	return seeds, nil, err
}

func (s *OriginHobbies) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseWooFeed(pageURL, body, nil, func(c string) bool { return !strings.HasSuffix(c, " Motors") })
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *OriginHobbies) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *OriginHobbies) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
