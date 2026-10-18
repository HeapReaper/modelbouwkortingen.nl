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

// Heligear (Breda) draait op CCV Shop; een kleine helikopterspecialist (~1.150 producten).
//
//   - Sitemap: /sitemap.xml → /ExportBestanden/SiteMap.php, alleen productpagina's
//     (/Webwinkel-Product-<id>/<naam>.html). Met zo weinig producten bezoeken we ze allemaal en
//     slaan we de listings over.
//   - Productpagina's: JSON-LD met Product (prijs, availability) en BreadcrumbList (merk/serie
//     en categorie, bv. "IL Goblin SAB > Kits"). Zonnebrillen (Rapid Eyewear) slaan we over.
type Heligear struct{}

func (*Heligear) Slug() string    { return "heligear" }
func (*Heligear) Name() string    { return "Heligear" }
func (*Heligear) BaseURL() string { return "https://www.heligear.nl" }
func (*Heligear) Description() string {
	return "Helikopterspecialist uit Breda met Mikado LOGO, Goblin, OMP en Tron, plus rotorbladen, elektronica en laders."
}

func (s *Heligear) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap.xml", nil)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var products []sitemap.URL
	for _, u := range urls {
		if heligearIDRe.MatchString(u.Loc) {
			products = append(products, u)
		}
	}
	return nil, products, nil
}

// ParseListing wordt niet gebruikt: we bezoeken alleen productpagina's (zie boven).
func (s *Heligear) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

var heligearIDRe = regexp.MustCompile(`/Webwinkel-Product-(\d+)/`)

func (s *Heligear) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	ld, crumbs := parse.JSONLD(doc)
	if ld == nil {
		return nil
	}
	url := firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL))
	m := heligearIDRe.FindStringSubmatch(url)
	if m == nil {
		return nil
	}
	// de laatste breadcrumb is het product zelf
	if len(crumbs) > 1 {
		crumbs = crumbs[:len(crumbs)-1]
	}
	if len(crumbs) > 0 && strings.Contains(strings.ToUpper(crumbs[0]), "EYEWEAR") {
		return nil
	}
	p := &parse.Product{
		ExternalID:  m[1],
		URL:         url,
		Name:        ld.Name,
		SKU:         ld.SKU,
		ImageURL:    ld.Image,
		Price:       ld.Price,
		InStock:     parse.Availability(ld.Availability),
		Breadcrumbs: crumbs,
	}
	// Alles is voor helikopters, maar alleen de Mikado-tak zegt dat in de breadcrumbs; een kit
	// van Goblin, Tron of OMP ("IL Goblin SAB > Kits") is anders niet als heli te herkennen.
	for _, c := range crumbs {
		if strings.EqualFold(c, "kits") {
			p.CategoryHint = "helicopter"
		}
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
