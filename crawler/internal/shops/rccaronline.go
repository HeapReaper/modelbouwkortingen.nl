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

// RC-Car-Online draait op Shopware 6 (zie shopware6.go) en is gespecialiseerd in 1:5- en
// 1:6-auto's (FG, Mecatech, Losi 5ive, HPI Baja) met onderdelen en tuning.
//
//   - robots.txt verbiedt alle URL's met een query (Disallow: /*?), dus ook de paginering
//     (?p=N) van de listings. We bezoeken daarom productpagina's.
//   - Sitemap: /sitemap.xml verwijst naar drie kopieën (www, zonder www en /de-startseite);
//     we volgen alleen die zonder www, waar de site ook naartoe stuurt. Productpagina's zijn
//     /<naam>/<artikelnummer> (~7.500), categorieën eindigen op "/".
//   - Overgeslagen: fanartikelen, kleding, catalogi en cadeaubonnen (via de breadcrumbs).
type RCCarOnline struct{}

func (*RCCarOnline) Slug() string    { return "rccaronline" }
func (*RCCarOnline) Name() string    { return "RC-Car-Online" }
func (*RCCarOnline) BaseURL() string { return "https://rc-car-online.de" }
func (*RCCarOnline) Description() string {
	return "Duitse specialist in grote 1:5- en 1:6-auto's van FG, Mecatech, Losi en HPI, met onderdelen, tuning en motoren."
}

var (
	rcCarOnlineProductRe = regexp.MustCompile(`^https://rc-car-online\.de/[^/]+/[^/]+$`)
	rcCarOnlineSkipRe    = regexp.MustCompile(`(?i)fanartikel|kleidung|kataloge|gutschein`)
)

func (s *RCCarOnline) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap.xml", func(loc string) bool {
		return strings.HasPrefix(loc, s.BaseURL()+"/sitemap/")
	})
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var products []sitemap.URL
	for _, u := range urls {
		if rcCarOnlineProductRe.MatchString(u.Loc) && !strings.HasPrefix(u.Loc, s.BaseURL()+"/Footer/") {
			products = append(products, u)
		}
	}
	return nil, products, nil
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *RCCarOnline) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

func (s *RCCarOnline) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	p := sw6ParseProduct(pageURL, doc)
	if p == nil || rcCarOnlineSkipRe.MatchString(strings.Join(p.Breadcrumbs, " ")) {
		return nil
	}
	return p
}
