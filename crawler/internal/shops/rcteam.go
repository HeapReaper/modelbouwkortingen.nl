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

// RCTeam (Firminy, Frankrijk; rcteam.fr verwijst door naar rcteam.com) draait op Shopify
// (zie shopify.go). Listings: de openbare feed /products.json. Shopify geeft daarvan maximaal
// 100 pagina's (25.000 producten); RC Team heeft er meer, dus de rest valt buiten de ronde.
// Productpagina's bezoeken we niet. Het producttype is de categorie (vaak een model, zoals
// "Slash"), de tags zijn alleen labels als "Promo" en tellen niet mee. Slotcars (Carrera) en
// die-cast slaan we over. Productnamen zijn Frans (zie src/lib/translate.ts).
type RCTeam struct{}

func (*RCTeam) Slug() string    { return "rcteam" }
func (*RCTeam) Name() string    { return "RC Team" }
func (*RCTeam) BaseURL() string { return "https://www.rcteam.com" }
func (*RCTeam) Description() string {
	return "Grote Franse RC-winkel in Firminy met Traxxas, Tamiya, Kyosho, HPI, Team Associated en Xray, plus onderdelen en gereedschap."
}

func (*RCTeam) UserAgent() string { return shopifyUserAgent }

func (*RCTeam) MinDelay() time.Duration { return 2 * time.Second }

var rcteamSkipRe = regexp.MustCompile(`(?i)carrera|diecast|circuits`)

func (s *RCTeam) Discover(context.Context, *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	return shopifyFeedSeeds(s.BaseURL()), nil, nil
}

func (s *RCTeam) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	products, next := parseShopifyFeed(s.BaseURL(), pageURL, body, func(string) bool { return false })
	out := products[:0]
	for _, p := range products {
		if !rcteamSkipRe.MatchString(p.CategoryHint) {
			out = append(out, p)
		}
	}
	return out, next
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *RCTeam) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *RCTeam) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
