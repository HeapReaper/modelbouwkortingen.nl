package shops

import (
	"context"
	"html"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// RCNMore (RC N-more, Lendelede, België) draait op EasyWebshop; vooral helikopters (SAB,
// Align, Mikado, Blade) en auto-onderdelen (Traxxas, Tamiya).
//
//   - Sitemap: /sitemap.xml (~12.000 URL's, zie rcnmoreProducts). Productpagina's zijn
//     /<categorie>/<product>, maar subcategorieën zien er net zo uit.
//   - Productpagina's (~10 KB): JSON-LD met Product (prijs, voorraad, sku, categorie zoals
//     "Traxxas onderdelen"). Het product-id staat in het winkelwagenformulier
//     (input name="id"). Er zijn geen bruikbare listings, dus we bezoeken alleen
//     productpagina's (~5.800).
type RCNMore struct{}

func (*RCNMore) Slug() string    { return "rcnmore" }
func (*RCNMore) Name() string    { return "RC N-more" }
func (*RCNMore) BaseURL() string { return "https://rcn-more.be" }
func (*RCNMore) Description() string {
	return "Belgische RC-winkel in Lendelede met veel onderdelen voor SAB-, Align-, Mikado- en Blade-heli's en Traxxas- en Tamiya-auto's."
}

func (*RCNMore) UserAgent() string { return "" }

func (*RCNMore) MinDelay() time.Duration { return time.Second }

func (s *RCNMore) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	resp, err := f.Get(ctx, s.BaseURL()+"/sitemap.xml")
	if err != nil {
		return nil, nil, err
	}
	return nil, rcnmoreProducts(resp.Body), nil
}

var (
	rcnmoreURLRe = regexp.MustCompile(`(?s)<url>(.*?)</url>`)
	rcnmoreLocRe = regexp.MustCompile(`<loc>\s*([^<\s]+)`)
	rcnmoreNLRe  = regexp.MustCompile(`hreflang="nl" href="([^"]+)"`)
)

// rcnmoreProducts haalt de mogelijke productpagina's uit de sitemap: Nederlandse URL's met
// minstens twee segmenten. Elke pagina staat er ook in de Engelse versie in, onder /en/ of
// onder een Engelse categorienaam; we houden alleen de URL die zijn eigen hreflang="nl" is.
// Subcategorieën ("/canopies/rompen") zien er hetzelfde uit; die leveren geen product op en
// komen daarna een week niet terug (crawl_misses).
func rcnmoreProducts(body []byte) []sitemap.URL {
	var out []sitemap.URL
	for _, m := range rcnmoreURLRe.FindAllSubmatch(body, -1) {
		loc := rcnmoreLocRe.FindSubmatch(m[1])
		if loc == nil {
			continue
		}
		u := html.UnescapeString(string(loc[1]))
		if nl := rcnmoreNLRe.FindSubmatch(m[1]); nl != nil && html.UnescapeString(string(nl[1])) != u {
			continue
		}
		if rcnmoreIsProduct(u) {
			out = append(out, sitemap.URL{Loc: u})
		}
	}
	return out
}

func rcnmoreIsProduct(loc string) bool {
	u, err := url.Parse(loc)
	if err != nil || u.Host != "rcn-more.be" {
		return false
	}
	// Een "/" in de productnaam blijft in de URL staan ("/sab-kits/goblin-570-red/yel").
	parts := strings.Split(strings.Trim(u.Path, "/"), "/")
	return len(parts) >= 2 && parts[0] != "en" && parts[0] != "webshop"
}

// rcnmoreHeliRe: in "SAB kits" of "Mikado kits" zit geen woord dat de indeling als heli
// herkent; de merken wel.
var rcnmoreHeliRe = regexp.MustCompile(`(?i)\b(sab|mikado|logo|align|t-?rex|gaui|oxy|goblin)\b`)

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *RCNMore) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

var rcnmoreCategoryRe = regexp.MustCompile(`"category"\s*:\s*"([^"]+)"`)

func (s *RCNMore) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	ld, _ := parse.JSONLD(doc)
	if ld == nil {
		return nil
	}
	pageURL = firstNonEmpty(parse.MetaContent(doc, "og:url"), stripQuery(pageURL))
	p := &parse.Product{
		ExternalID: firstNonEmpty(attr(doc.Find(`#webshop_detailform input[name="id"]`).First(), "value"), pageURL),
		URL:        pageURL,
		Name:       ld.Name,
		SKU:        ld.SKU,
		ImageURL:   ld.Image,
		Price:      ld.Price,
		InStock:    parse.Availability(ld.Availability),
	}
	doc.Find(`script[type="application/ld+json"]`).EachWithBreak(func(_ int, sc *goquery.Selection) bool {
		if m := rcnmoreCategoryRe.FindStringSubmatch(sc.Text()); m != nil {
			p.Breadcrumbs = []string{parse.Clean(m[1])}
			if rcnmoreHeliRe.MatchString(m[1]) {
				p.CategoryHint = "helicopter"
			}
			return false
		}
		return true
	})
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
