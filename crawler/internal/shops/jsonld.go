package shops

import (
	"context"
	"net/url"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Gedeelde aanpak voor shops zonder bruikbare feed of listings: de productpagina's komen uit
// de XML-sitemap en de gegevens uit het schema.org Product-blok (JSON-LD of microdata). De
// runner bezoekt per ronde hooguit CRAWLER_MAX_PRODUCT_PAGES productpagina's; bij grotere shops
// is niet elk product elke ronde aan de beurt.

// ldSitemapProducts haalt de sitemap (of sitemap-index) op en houdt de URL's over waarvoor
// isProduct true geeft.
func ldSitemapProducts(ctx context.Context, f *fetch.Fetcher, sitemapURL string, isProduct func(string) bool) ([]sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, sitemapURL, nil)
	if err != nil && len(urls) == 0 {
		return nil, err
	}
	var out []sitemap.URL
	seen := map[string]bool{}
	for _, u := range urls {
		if !seen[u.Loc] && isProduct(u.Loc) {
			seen[u.Loc] = true
			out = append(out, u)
		}
	}
	return out, nil
}

// ldParseProduct leest een productpagina met een JSON-LD Product, of anders schema.org-
// microdata. idRe haalt het product-id uit de (canonieke) URL (groep 1); zonder idRe of zonder
// match is het id de SKU, of anders het pad van de URL. De eerste breadcrumb ("Home") en een
// laatste die de productnaam is vallen weg. Zonder JSON-LD- of microdata-breadcrumbs gebruiken we
// de gewone breadcrumb-lijst van de pagina.
func ldParseProduct(pageURL string, doc *goquery.Document, idRe *regexp.Regexp) *parse.Product {
	ld, crumbs := parse.JSONLD(doc)
	if ld == nil || ld.Price == 0 {
		// Geen (bruikbaar) JSON-LD: probeer schema.org-microdata.
		if md := parse.MicrodataProduct(doc); md != nil && md.Price > 0 {
			ld = md
		}
	}
	if len(crumbs) == 0 {
		crumbs = parse.MicrodataCrumbs(doc)
	}
	if len(crumbs) == 0 {
		crumbs = parse.HTMLCrumbs(doc)
	}
	if ld == nil || ld.Price == 0 || ld.Name == "" {
		return nil
	}
	link := firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL))
	if len(crumbs) > 0 && strings.EqualFold(crumbs[len(crumbs)-1], ld.Name) {
		crumbs = crumbs[:len(crumbs)-1]
	}
	if len(crumbs) > 1 {
		crumbs = crumbs[1:]
	}
	p := &parse.Product{
		URL:         link,
		Name:        ld.Name,
		SKU:         ld.SKU,
		Brand:       ld.Brand,
		ImageURL:    firstNonEmpty(ld.Image, parse.MetaContent(doc, "og:image")),
		Price:       ld.Price,
		InStock:     parse.Availability(ld.Availability),
		Breadcrumbs: crumbs,
	}
	if idRe != nil {
		if m := idRe.FindStringSubmatch(link); m != nil {
			p.ExternalID = m[1]
		}
	}
	if p.ExternalID == "" {
		p.ExternalID = p.SKU
	}
	if p.ExternalID == "" {
		if u, err := url.Parse(link); err == nil {
			p.ExternalID = strings.Trim(u.Path, "/")
		}
	}
	// Een @id-verwijzing ("#primaryimage") is geen afbeelding; een pad wel.
	if strings.HasPrefix(p.ImageURL, "/") {
		if u, err := url.Parse(link); err == nil {
			p.ImageURL = parse.AbsURL(u.Scheme+"://"+u.Host, p.ImageURL)
		}
	}
	if !strings.HasPrefix(p.ImageURL, "http") {
		p.ImageURL = parse.MetaContent(doc, "og:image")
	}
	return p
}

// ldParseListing leest de producten uit een JSON-LD ItemList op een categoriepagina. Het id is
// de SKU, of anders het pad van de product-URL. De breadcrumbs van de pagina (zonder "Home")
// worden de categoriehint.
func ldParseListing(doc *goquery.Document) []parse.Product {
	items, crumbs := parse.JSONLDProducts(doc)
	if len(crumbs) > 1 {
		crumbs = crumbs[1:]
	}
	hint := strings.Join(crumbs, " | ")
	var out []parse.Product
	for _, it := range items {
		p := parse.Product{
			ExternalID:   it.SKU,
			URL:          stripQuery(it.URL),
			Name:         it.Name,
			SKU:          it.SKU,
			Brand:        it.Brand,
			ImageURL:     it.Image,
			Price:        it.Price,
			InStock:      parse.Availability(it.Availability),
			CategoryHint: hint,
		}
		if p.ExternalID == "" {
			if u, err := url.Parse(p.URL); err == nil {
				p.ExternalID = strings.Trim(u.Path, "/")
			}
		}
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	}
	return out
}
