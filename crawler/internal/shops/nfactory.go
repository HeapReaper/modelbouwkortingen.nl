package shops

import (
	"context"
	"html"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// N-Factory draait op JTL-Shop 5 met het Snackys-thema: dezelfde URL's als NOVA (zie jtl.go),
// maar andere HTML.
//
//   - Categorieën: het menu (#cat-w) op de homepage. De HTML-sitemap mist een deel (o.a.
//     Motoren), en sommige hoofdcategorieën zijn landingspagina's zonder producten.
//     Overgeslagen: merchandise, cadeaubonnen, de 3D-printservice, gebruikte artikelen en de
//     Neu-/Sale-lijsten (dubbel).
//   - Listings: 50 producten per pagina met ?af=50, paginering via <categorie>_s2, ...
//     Elke kaart heeft het artikelnummer in id="result-wrapper_buy_form_<id>", de prijs in
//     meta[itemprop=price] en een json-article-data-script met artikelcode, merk en
//     categorieën. Teruggestuurde artikelen ("Rückläufer") staan ook in gewone categorieën;
//     die herkennen we aan de categorie Gebrauchtes.
//   - Productpagina's bezoeken we niet: de listings bevatten alle data.
type NFactory struct{}

func (*NFactory) Slug() string    { return "nfactory" }
func (*NFactory) Name() string    { return "N-Factory" }
func (*NFactory) BaseURL() string { return "https://n-factory.de" }
func (*NFactory) Description() string {
	return "Duitse FPV-specialist met drones, frames, motoren, flight controllers, videobrillen, lipo's en propellers."
}

const nfactoryPerPage = 50

var nfactoryQuery = "?af=" + strconv.Itoa(nfactoryPerPage)

var (
	nfactorySkipRe     = regexp.MustCompile(`(?i)^(swag|t-shirt|cap|aufkleber|gutschein|gebrauchtes|3d-druck-service|neu-im-sortiment|sonderangebote)$`)
	nfactoryArticleRe  = regexp.MustCompile(`'(item_id|brand|item_category\d*)':\s*'((?:[^'\\]|\\.)*)'`)
	nfactoryStatusRe   = regexp.MustCompile(`\bstatus-(\d)\b`)
	nfactoryCardPrefix = "result-wrapper_buy_form_"
)

func (s *NFactory) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	doc, final, err := fetchDoc(ctx, f, s.BaseURL()+"/")
	if err != nil {
		return nil, nil, err
	}
	base, _ := url.Parse(final)
	var out []string
	doc.Find("#cat-w a[href]").Each(func(_ int, a *goquery.Selection) {
		u, err := base.Parse(attr(a, "href"))
		if err != nil || u.Host != base.Host {
			return
		}
		path := strings.Trim(u.Path, "/")
		if path == "" || strings.Contains(path, "/") || nfactorySkipRe.MatchString(path) {
			return
		}
		out = append(out, s.BaseURL()+"/"+path+nfactoryQuery)
	})
	return dedupe(out), nil, nil
}

func (s *NFactory) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	_, crumbs := parse.JSONLD(doc)
	if len(crumbs) > 1 {
		crumbs = crumbs[1:] // "Startseite"
	}
	var out []parse.Product
	doc.Find(`#p-l .p-c[id^="` + nfactoryCardPrefix + `"]`).Each(func(_ int, card *goquery.Selection) {
		link := card.Find(".caption a.title").First()
		article := map[string]string{}
		var cats []string
		for _, m := range nfactoryArticleRe.FindAllStringSubmatch(card.Find("script.json-article-data").Text(), -1) {
			v := unescapeJSONString(m[2])
			article[m[1]] = v
			if strings.HasPrefix(m[1], "item_category") {
				cats = append(cats, v)
			}
		}
		for _, c := range cats {
			if strings.EqualFold(c, "Gebrauchtes") {
				return
			}
		}
		var inStock *bool
		if m := nfactoryStatusRe.FindStringSubmatch(attr(card.Find(".delivery-status .signal_image").First(), "class")); m != nil {
			inStock = inStockFrom(m[1] != "0", m[1] == "0")
		}
		p := parse.Product{
			ExternalID:   strings.TrimPrefix(attr(card, "id"), nfactoryCardPrefix),
			URL:          stripQuery(attr(link, "href")),
			Name:         parse.Clean(link.Text()),
			SKU:          article["item_id"],
			Brand:        article["brand"],
			ImageURL:     imgSrc(card.Find(".img-w img").First()),
			Price:        parse.Price(attr(card.Find(`meta[itemprop="price"]`).First(), "content")),
			InStock:      inStock,
			CategoryHint: strings.Join(append(crumbs, cats...), " | "),
		}
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	if len(out) == 0 {
		return out, ""
	}
	return out, jtlNextPage(pageURL, doc, nfactoryQuery)
}

// ParseProduct is alleen voor parsecheck: de crawler haalt alles uit de listings.
func (s *NFactory) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	id := attr(doc.Find("input.current_article").First(), "value")
	ld, crumbs := parse.JSONLD(doc)
	if id == "" || ld == nil || ld.Price == 0 {
		return nil
	}
	if len(crumbs) > 2 {
		crumbs = crumbs[1 : len(crumbs)-1]
	}
	return &parse.Product{
		ExternalID:  id,
		URL:         firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:        firstNonEmpty(parse.Clean(doc.Find("h1").First().Text()), html.UnescapeString(ld.Name)),
		SKU:         ld.SKU,
		Brand:       ld.Brand,
		ImageURL:    firstNonEmpty(parse.MetaContent(doc, "og:image"), parse.AbsURL(s.BaseURL(), ld.Image)),
		Price:       ld.Price,
		InStock:     parse.Availability(ld.Availability),
		Breadcrumbs: crumbs,
	}
}
