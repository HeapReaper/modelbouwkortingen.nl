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

// Tormodel (Spanje) is een modelvliegwinkel op PrestaShop. Alle ~3.400 producten komen uit de
// JSON-listing van de hoofdcategorie (zie prestashop.go), ~35 pagina's. Productnamen zijn Spaans
// (zie src/lib/translate.ts). Statische replica's en maquettes, hout (balsa, paulownia, triplex)
// en brandstof slaan we over.
type Tormodel struct{}

func (*Tormodel) Slug() string    { return "tormodel" }
func (*Tormodel) Name() string    { return "Tormodel" }
func (*Tormodel) BaseURL() string { return "https://www.tormodel.com" }
func (*Tormodel) Description() string {
	return "Spaanse modelvliegwinkel met Dynam- en Volantex-vliegtuigen, heli-onderdelen, propellers, motoren, servo's, accu's en bouwbenodigdheden."
}

func (*Tormodel) UserAgent() string { return "" }

func (*Tormodel) MinDelay() time.Duration { return 2 * time.Second }

var tormodelSkipRe = regexp.MustCompile(`(?i)maquetas|aviones/helicopteros|balsa|paulownia|contrachapados|listones|bordes ataque|combustible`)

func (s *Tormodel) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := psSeeds(ctx, f, psFeed(s.BaseURL()+"/2-inicio"))
	return seeds, nil, err
}

func (s *Tormodel) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parsePSListing(pageURL, body, tormodelSkipRe.MatchString)
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *Tormodel) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *Tormodel) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
