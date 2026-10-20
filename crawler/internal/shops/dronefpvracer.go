package shops

import (
	"context"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// DroneFPVRacer (Bois-de-Haye, Frankrijk) is een FPV-specialist op PrestaShop 8. Alle ~4.700
// producten komen uit de JSON-listing van de hoofdcategorie (zie prestashop.go), ~47 pagina's.
// Alles is voor drones; de standaardcategorie ("Hélices", "Moteurs", "Batteries") bepaalt de
// indeling, met "fpv" als hint voor wat daar niet onder valt. Productnamen zijn Frans (zie
// src/lib/translate.ts).
type DroneFPVRacer struct{}

func (*DroneFPVRacer) Slug() string    { return "dronefpvracer" }
func (*DroneFPVRacer) Name() string    { return "Drone FPV Racer" }
func (*DroneFPVRacer) BaseURL() string { return "https://www.drone-fpv-racer.com" }
func (*DroneFPVRacer) Description() string {
	return "Franse FPV-specialist met racedrones, frames, motoren, flight controllers, videobrillen, lipo's en propellers."
}

func (*DroneFPVRacer) UserAgent() string { return "" }

func (*DroneFPVRacer) MinDelay() time.Duration { return 2 * time.Second }

func (s *DroneFPVRacer) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := psSeeds(ctx, f, psFeed(s.BaseURL()+"/2-accueil"))
	return seeds, nil, err
}

func (s *DroneFPVRacer) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	products, next := parsePSListing(pageURL, body, nil)
	for i := range products {
		products[i].CategoryHint = "fpv"
	}
	return products, next
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *DroneFPVRacer) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *DroneFPVRacer) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
