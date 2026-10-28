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

// RadioControlledShop (Dublin, Ierland) draait op PrestaShop. Alle ~6.000 producten komen uit de
// JSON-listing van de hoofdcategorie (zie prestashop.go), ~60 pagina's. Productnamen zijn Engels.
// Gebruikte producten en bouwmaterialen (balsa, houten latten, metalen staven) slaan we over;
// video's met prijs 0 vallen vanzelf af.
type RadioControlledShop struct{}

func (*RadioControlledShop) Slug() string    { return "radiocontrolledshop" }
func (*RadioControlledShop) Name() string    { return "Radio Controlled Shop" }
func (*RadioControlledShop) BaseURL() string { return "https://www.radiocontrolledshop.ie" }
func (*RadioControlledShop) Description() string {
	return "Ierse RC-winkel in Dublin met veel onderdelen voor heli's (Align, Blade), drones (DJI) en auto's, plus accu's, laders, kabels en propellers."
}

func (*RadioControlledShop) UserAgent() string { return "" }

func (*RadioControlledShop) MinDelay() time.Duration { return 2 * time.Second }

var radiocontrolledshopSkipRe = regexp.MustCompile(`(?i)used products|wood strips|balsa|metal rods`)

func (s *RadioControlledShop) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := psSeeds(ctx, f, psFeed(s.BaseURL()+"/2-home"))
	return seeds, nil, err
}

func (s *RadioControlledShop) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parsePSListing(pageURL, body, radiocontrolledshopSkipRe.MatchString)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *RadioControlledShop) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *RadioControlledShop) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
