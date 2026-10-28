package shops

import (
	"context"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
)

// Gedeelde helpers voor shops op JTL-Shop 5 (NOVA-thema), zoals Tamico en Hepf.
//
//   - Categorieën: de HTML-sitemap /Sitemap ("Alle Kategorien") geeft elke categorie met de
//     hoofdcategorie in het title-attribuut; een hoofdcategorie zelf heeft naam == title.
//   - Listings: paginering via <categorie>_s2, _s3, ... Elke productkaart heeft schema.org-
//     microdata (naam, sku, merk, prijs, availability) en het artikelnummer in <input name="a">.
//   - Productpagina's: het hoofdproduct staat in #result-wrapper; het artikelnummer in
//     input.current_article, breadcrumbs als BreadcrumbList-microdata.

// jtlCategories geeft de subcategorieën uit /Sitemap, met `query` (bv. "?af=50") erachter.
// skip krijgt de hoofdcategorie en de naam van elke subcategorie.
func jtlCategories(ctx context.Context, f *fetch.Fetcher, baseURL, query string, skip func(top, name string) bool) ([]string, error) {
	doc, _, err := fetchDoc(ctx, f, baseURL+"/Sitemap")
	if err != nil {
		return nil, err
	}
	var out []string
	doc.Find(".sitemap-wrapper-categories li a[href]").Each(func(_ int, a *goquery.Selection) {
		top := parse.Clean(attr(a, "title"))
		name := parse.Clean(a.Text())
		href := stripQuery(attr(a, "href"))
		if href == "" || name == top || (skip != nil && skip(top, name)) {
			return
		}
		out = append(out, href+query)
	})
	return dedupe(out), nil
}

// jtlCategoryBox leest de onderste categorieën uit de NOVA-categoriebox (.snippets-categories)
// op pageURL, voor shops waarvan /Sitemap geen categorieën toont. top is de categorie op het
// hoogste niveau.
func jtlCategoryBox(ctx context.Context, f *fetch.Fetcher, pageURL, query string, skip func(top, name string) bool) ([]string, error) {
	doc, _, err := fetchDoc(ctx, f, pageURL)
	if err != nil {
		return nil, err
	}
	var out []string
	doc.Find(".snippets-categories-collapse li.nav-item:not(.dropdown) > a[href]").Each(func(_ int, a *goquery.Selection) {
		top := parse.Clean(a.ParentsFiltered("li.nav-item.dropdown").Last().ChildrenFiltered("span").Find("a").First().Text())
		if href := stripQuery(attr(a, "href")); href != "" && (skip == nil || !skip(top, parse.Clean(a.Text()))) {
			out = append(out, href+query)
		}
	})
	return dedupe(out), nil
}

// jtlParseListing leest de productkaarten van een categoriepagina. `query` komt achter de
// volgende pagina, omdat de links in de paginering hem verliezen.
func jtlParseListing(pageURL string, doc *goquery.Document, query string) ([]parse.Product, string) {
	crumbs := parse.MicrodataCrumbs(doc)
	if len(crumbs) > 1 {
		crumbs = crumbs[1:] // "Startseite"
	}
	hint := strings.Join(crumbs, " | ")
	var out []parse.Product
	doc.Find(`#product-list .product-wrapper[itemtype$="schema.org/Product"]`).Each(func(_ int, card *goquery.Selection) {
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
		if p.InStock == nil {
			p.InStock = jtlSignal(card)
		}
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	if len(out) == 0 {
		return out, ""
	}
	return out, jtlNextPage(pageURL, doc, query)
}

var jtlStatusRe = regexp.MustCompile(`\bstatus-(\d)\b`)

// jtlSignal leest het voorraadlampje (.signal_image status-N) voor shops die geen
// availability-microdata tonen: status-0 is "nicht verfügbar", hogere statussen zijn leverbaar.
func jtlSignal(s *goquery.Selection) *bool {
	m := jtlStatusRe.FindStringSubmatch(attr(s.Find(".signal_image").First(), "class"))
	if m == nil {
		return nil
	}
	in := m[1] != "0"
	return &in
}

var jtlPageRe = regexp.MustCompile(`_s(\d+)$`)

// jtlNextPage geeft <categorie>_s<huidige+1> als de paginering die pagina kent.
func jtlNextPage(pageURL string, doc *goquery.Document, query string) string {
	base := stripQuery(pageURL)
	cur := 1
	if m := jtlPageRe.FindStringSubmatch(base); m != nil {
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
	return next + query
}

func jtlParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
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
	if p.InStock == nil {
		p.InStock = jtlSignal(main)
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
