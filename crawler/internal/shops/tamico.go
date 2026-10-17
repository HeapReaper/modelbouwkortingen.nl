package shops

import (
	"context"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/fetch"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/sitemap"
)

// Tamico draait op JTL-Shop 5 (NOVA-thema).
//
//   - robots.txt vraagt Crawl-delay: 5. De XML-sitemap (gzip-bestanden, ~42.000 URL's) bevat elk
//     product in het Duits én Engels met hetzelfde artikelnummer; we bezoeken daarom geen
//     productpagina's, de listings bevatten alle data al (~1.000 requests per ronde).
//   - Categorieën: de HTML-sitemap /Sitemap ("Alle Kategorien") geeft elke categorie met de
//     hoofdcategorie in het title-attribuut. We nemen alle subcategorieën, behalve de
//     "Neu 2026-xx"-lijsten en de SALE-groep: die tonen alleen dubbele producten en zouden
//     als eerste waarneming een nietszeggende categorie opleveren.
//   - Listings: 50 producten per pagina met ?af=50, paginering via <categorie>_s2, _s3, ...
//     Elke productkaart heeft schema.org-microdata (naam, sku, merk, prijs, availability) en
//     het artikelnummer in <input name="a">. Een "statt"-prijs staat niet op de listings.
//   - Productpagina's (alleen voor parsecheck): het hoofdproduct staat in #result-wrapper,
//     het artikelnummer in input.current_article, breadcrumbs als BreadcrumbList-microdata.
type Tamico struct{}

func (*Tamico) Slug() string    { return "tamico" }
func (*Tamico) Name() string    { return "Tamico" }
func (*Tamico) BaseURL() string { return "https://tamico.de" }
func (*Tamico) Description() string {
	return "Duitse RC-car-specialist met veel Tamiya, Kyosho en Traxxas, plus trucks, tanks en een enorm onderdelenassortiment."
}

const tamicoPerPage = 50

var tamicoSkipCategoryRe = regexp.MustCompile(`(?i)^(neu\b|neu-|vorbestellen)`)

func (s *Tamico) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	doc, _, err := fetchDoc(ctx, f, s.BaseURL()+"/Sitemap")
	if err != nil {
		return nil, nil, err
	}
	var listings []string
	doc.Find(".sitemap-wrapper-categories li a[href]").Each(func(_ int, a *goquery.Selection) {
		top := parse.Clean(attr(a, "title"))
		name := parse.Clean(a.Text())
		href := stripQuery(attr(a, "href"))
		if href == "" || name == top || strings.Contains(top, "SALE") || tamicoSkipCategoryRe.MatchString(name) {
			return
		}
		listings = append(listings, href+"?af="+strconv.Itoa(tamicoPerPage))
	})
	return dedupe(listings), nil, nil
}

var tamicoPageRe = regexp.MustCompile(`_s(\d+)$`)

func (s *Tamico) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	crumbs := parse.MicrodataCrumbs(doc)
	if len(crumbs) > 1 {
		crumbs = crumbs[1:] // "Startseite"
	}
	hint := strings.Join(crumbs, " | ")
	var out []parse.Product
	cards := doc.Find(`#product-list .product-wrapper[itemtype$="schema.org/Product"]`)
	cards.Each(func(_ int, card *goquery.Selection) {
		link := card.Find(".productbox-title a").First()
		offers := card.Find(`[itemprop="offers"]`).First()
		p := parse.Product{
			ExternalID:   attr(card.Find(`input[name="a"]`).First(), "value"),
			URL:          stripQuery(attr(link, "href")),
			Name:         parse.Clean(link.Text()),
			SKU:          attr(card.Find(`meta[itemprop="sku"]`).First(), "content"),
			Brand:        attr(card.Find(`[itemprop="brand"] meta[itemprop="name"]`).First(), "content"),
			ImageURL:     imgSrc(card.Find(".productbox-image img").First()),
			Price:        parse.Price(attr(offers.Find(`meta[itemprop="price"]`).First(), "content")),
			InStock:      parse.Availability(attr(offers.Find(`[itemprop="availability"]`).First(), "href")),
			CategoryHint: hint,
		}
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	if cards.Length() < tamicoPerPage {
		return out, ""
	}
	return out, tamicoNextPage(pageURL, doc)
}

// tamicoNextPage geeft <categorie>_s<huidige+1>?af=50 als de paginering die pagina kent.
// De links in de paginering verliezen ?af=50, dus die voegen we zelf weer toe.
func tamicoNextPage(pageURL string, doc *goquery.Document) string {
	base := stripQuery(pageURL)
	cur := 1
	if m := tamicoPageRe.FindStringSubmatch(base); m != nil {
		cur, _ = strconv.Atoi(m[1])
		base = base[:len(base)-len(m[0])]
	}
	next := base + "_s" + strconv.Itoa(cur+1)
	found := false
	doc.Find(`a[href]`).EachWithBreak(func(_ int, a *goquery.Selection) bool {
		found = stripQuery(attr(a, "href")) == next
		return !found
	})
	if !found {
		return ""
	}
	return next + "?af=" + strconv.Itoa(tamicoPerPage)
}

func (s *Tamico) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	main := doc.Find("#result-wrapper").First()
	id := attr(main.Find("input.current_article").First(), "value")
	if id == "" {
		return nil
	}
	offer := main.Find(`.product-offer[itemprop="offers"]`).First()
	crumbs := parse.MicrodataCrumbs(doc)
	// eerste (Startseite) en laatste (het product zelf) breadcrumb zijn niet interessant
	if len(crumbs) > 2 {
		crumbs = crumbs[1 : len(crumbs)-1]
	}
	p := &parse.Product{
		ExternalID:  id,
		URL:         firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:        parse.Clean(main.Find(`h1[itemprop="name"]`).First().Text()),
		SKU:         parse.Clean(main.Find(`[itemprop="sku"]`).First().Text()),
		Brand:       attr(main.Find(`[itemprop="brand"] meta[itemprop="name"]`).First(), "content"),
		ImageURL:    parse.MetaContent(doc, "og:image"),
		Price:       parse.Price(attr(main.Find(`meta[itemprop="price"]`).First(), "content")),
		InStock:     parse.Availability(attr(offer.Find(`[itemprop="availability"]`).First(), "href")),
		Breadcrumbs: crumbs,
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
