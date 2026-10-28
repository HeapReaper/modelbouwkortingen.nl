package shops

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Lindinger (Oostenrijk) draait op Shopware 6 met het Acris-thema (zie shopware6.go).
//
//   - Sitemap: /de/sitemap.xml, drie gzip-bestanden met ~137.000 producten (ook uit het
//     archief) en ~1.500 categorieën. Categorieën eindigen op "/".
//   - Listings: een categorie toont ook alle producten van haar subcategorieën, en veel
//     producten (bv. ~21.000 auto-onderdelen) hangen alleen aan een bovenliggende categorie.
//     We nemen daarom de categorieën op het tweede niveau van de RC-bomen, met ?limit=100
//     (het maximum). Een pagina is ~11 MB HTML (~700 KB gzip) en kost de server ~3 s; met
//     50 pagina's per categorie (zie crawl.maxListingPagesPerSeed) zien we van de grootste
//     onderdelencategorieën alleen de eerste 5.000 producten.
//   - Overgeslagen: de merken-, landingspagina-, sale- en neuhedenbomen (dubbel), en uit
//     Bauzubehör: boeken, cadeaubonnen, cursussen, reclameartikelen en plastic standmodellen.
//   - Listings zonder bestelknop (B-Ware) slaan we over: die kaarten hebben geen product-UUID.
//   - Voorraad: de schema.org-availability klopt niet ("Nur noch wenige auf Lager" staat als
//     InStock, "Vorbestellung möglich. Nicht lagernd." als LimitedAvailability). We lezen de
//     tooltip van het statusbolletje en tellen alleen "Auf Lager. ..." als op voorraad.
//   - Productpagina's bezoeken we niet: ze zijn ~770 KB per product, en het Acris-thema laat
//     daar de standaard-opmaak (h1.product-detail-name, prijscontainer) weg.
type Lindinger struct{}

func (*Lindinger) Slug() string    { return "lindinger" }
func (*Lindinger) Name() string    { return "Lindinger" }
func (*Lindinger) BaseURL() string { return "https://www.lindinger.at" }
func (*Lindinger) Description() string {
	return "Grote Oostenrijkse modelbouwzaak met vliegtuigen, heli's, drones, auto's en boten, plus elektronica, accu's en onderdelen."
}

func (*Lindinger) UserAgent() string { return "" }

// MinDelay: de listings zijn zwaar voor de server (zie boven).
func (*Lindinger) MinDelay() time.Duration { return 2 * time.Second }

var (
	lindingerCategoryRe = regexp.MustCompile(`^https://www\.lindinger\.at/de/(RC-Flugzeuge|Drohnen-Helikopter|Fahrzeuge-Boote|Akkus|RC-Elektronik|Bauzubehoer-Mehr)/([^/]+)/$`)
	lindingerSkipRe     = regexp.MustCompile(`(?i)^(gutscheine|buecher|schulungen|werbeartikel|kataloge|plastikmodellbau)`)
)

func (s *Lindinger) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/de/sitemap.xml", nil)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var listings []string
	for _, u := range urls {
		m := lindingerCategoryRe.FindStringSubmatch(u.Loc)
		if m == nil || lindingerSkipRe.MatchString(m[2]) {
			continue
		}
		listings = append(listings, u.Loc+"?limit=100")
	}
	return dedupe(listings), nil, nil
}

// lindingerPathRe haalt het categoriepad uit een product-URL: /de/<categorieën>/<naam>/<nummer>.
var lindingerPathRe = regexp.MustCompile(`/de/(.+)/[^/]+/\d+$`)

func (s *Lindinger) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	products, next := sw6ParseListing(pageURL, doc, lindingerInStock)
	// De listing-breadcrumbs zijn maar twee niveaus diep ("RC-Flugzeuge | ...-Antriebe"); het
	// pad in de product-URL is preciezer (".../Luftschrauben") en houdt propellers bij onderdelen.
	for i := range products {
		if m := lindingerPathRe.FindStringSubmatch(products[i].URL); m != nil {
			products[i].CategoryHint = strings.NewReplacer("/", " | ", "-", " ").Replace(m[1])
		}
	}
	return products, next
}

// lindingerInStock leest de tooltip van het statusbolletje (zie boven).
func lindingerInStock(card *goquery.Selection) *bool {
	title := strings.TrimSpace(attr(card.Find(".delivery-status-indicator[title]").First(), "title"))
	if title == "" {
		return parse.Availability(attr(card.Find(`[itemprop="availability"]`).First(), "href"))
	}
	in := strings.HasPrefix(title, "Auf Lager")
	return &in
}

func (s *Lindinger) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	return sw6ParseProduct(pageURL, doc)
}
