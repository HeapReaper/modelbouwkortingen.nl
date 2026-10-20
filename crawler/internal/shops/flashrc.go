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

// FlashRC (Frankrijk) is een grote RC-winkel op PrestaShop. Alle ~21.000 producten komen uit
// de JSON-listing van de hoofdcategorie in de Franse winkel (/fr/2-accueil, zie
// prestashop.go), ~215 pagina's. De standaardcategorie is soms een merk ("Serpent"); dan
// wordt het product op de naam ingedeeld. Kleding en bouwmaterialen (balsa, buizen) slaan we
// over. Productnamen zijn Frans (zie src/lib/translate.ts).
type FlashRC struct{}

func (*FlashRC) Slug() string    { return "flashrc" }
func (*FlashRC) Name() string    { return "FlashRC" }
func (*FlashRC) BaseURL() string { return "https://www.flashrc.com" }
func (*FlashRC) Description() string {
	return "Grote Franse RC-winkel met vliegtuigen, helikopters, auto's, drones en boten, plus zenders, accu's, motoren en onderdelen."
}

func (*FlashRC) UserAgent() string { return "" }

func (*FlashRC) MinDelay() time.Duration { return 2 * time.Second }

var flashrcSkipRe = regexp.MustCompile(`(?i)v[êe]tements|tubes|balsa|contreplaqu|carte cadeau`)

func (s *FlashRC) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := psSeeds(ctx, f, psFeed(s.BaseURL()+"/fr/2-accueil"))
	return seeds, nil, err
}

func (s *FlashRC) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parsePSListing(pageURL, body, flashrcSkipRe.MatchString)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *FlashRC) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *FlashRC) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
