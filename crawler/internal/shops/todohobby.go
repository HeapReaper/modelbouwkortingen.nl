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

// TodoHobby (Spanje) is een brede hobbywinkel op PrestaShop. Alle ~13.000 producten komen uit de
// JSON-listing van de hoofdcategorie (zie prestashop.go), ~131 pagina's. Productnamen zijn Spaans
// (zie src/lib/translate.ts). Poppenhuizen en meubeltjes, puzzels, decoratie, speelgoed,
// statische (scheeps)modelbouw, darts, handboogschieten en kleding slaan we over, op categorie en
// op URL.
type TodoHobby struct{}

func (*TodoHobby) Slug() string    { return "todohobby" }
func (*TodoHobby) Name() string    { return "TodoHobby" }
func (*TodoHobby) BaseURL() string { return "https://todohobby.net" }
func (*TodoHobby) Description() string {
	return "Spaanse hobbywinkel met RC-auto's, vliegtuigen, drones en boten, verbrandingsmotoren en turbines, plus onderdelen, accu's en gereedschap."
}

func (*TodoHobby) UserAgent() string { return "" }

func (*TodoHobby) MinDelay() time.Duration { return 2 * time.Second }

var todohobbySkipRe = regexp.MustCompile(`(?i)muebles|dormitorio|cocina|baño|muñecas|casas|puzzle|cuadros|azulejos|papeles y ornamentos|lampara|pilotos y decoracion|decoraci|juguetes|juegos|construcciones|naval|^barcos$|maquetas|figuras|trenes|ferrocarril|ambiente|salón|jardin|manualidades`)

func (s *TodoHobby) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds, err := psSeeds(ctx, f, psFeed(s.BaseURL()+"/es/2-inicio"))
	return seeds, nil, err
}

func (s *TodoHobby) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	products, next := parsePSListing(pageURL, body, todohobbySkipRe.MatchString)
	out := products[:0]
	for _, p := range products {
		if !todohobbySkipURLRe.MatchString(p.URL) {
			out = append(out, p)
		}
	}
	return out, next
}

// todohobbySkipURLRe: de standaardcategorie in de JSON is niet altijd de juiste; de URL bevat
// de categorie waar het product op de site onder staat. Daarmee vallen ook darts, handboog,
// kleding, vloeren en aanbetalingen af; poppenhuisspullen beginnen met "zz-".
var todohobbySkipURLRe = regexp.MustCompile(`(?i)/es/(dianas|dardos|tiro-con-arco|ropa|suelos|salon|sala|pago-a-cuenta|haya|muebles|dormitorios|cocina|bano|puzzles|juguetes|juegos)[^/]*/|/\d+-zz-`)

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *TodoHobby) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *TodoHobby) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
