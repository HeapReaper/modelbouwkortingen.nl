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

// Hacker (hacker-motor-shop.com) draait op e-vendo en heeft geen sitemap.
//
//   - Discovery: vanaf de homepage de categorieboom volgen (links met ?a=catalog&p=<id>).
//     Productlinks (?a=article&ProdNr=<nr>) die we onderweg zien worden de productpagina's.
//   - Listings: article.item[data-prodnr] met .itemprice .amount; 60 per pagina, de
//     "Weiter zur nächsten Seite"-knop verwijst naar &Start=60, 120, ...
//   - Productpagina's: #product_detail_vue[data-prodnr]; de prijs staat server-side in .itemprice.
//   - De pagina's zijn Windows-1252; parse.Document zet dat om naar UTF-8.
//   - Een product hangt via &p=<categorie> aan meerdere URL's; we bewaren het zonder &p.
//   - Links zijn relatief zonder "/" (en zonder <base>), maar bedoeld vanaf de root.
type Hacker struct{}

func (*Hacker) Slug() string    { return "hacker" }
func (*Hacker) Name() string    { return "Hacker Motor" }
func (*Hacker) BaseURL() string { return "https://www.hacker-motor-shop.com" }
func (*Hacker) Description() string {
	return "Duitse fabrikant van brushless motoren, met eigen webshop voor motoren, regelaars, accu's en modellen."
}

const hackerMaxCategories = 1500

// Informatieve "categorieën" zonder producten.
var hackerSkipRe = regexp.MustCompile(`(?i)(Downloads|Videos|Veranstaltungen|eCalc|Service-Repair|Batteriegesetz|Wartungshinweise|Gutschein)`)

func (s *Hacker) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	queue := []string{s.BaseURL() + "/"}
	seenCat := map[string]bool{}
	seenProd := map[string]bool{}
	var categories []string
	var products []sitemap.URL
	for len(queue) > 0 && len(seenCat) <= hackerMaxCategories && ctx.Err() == nil {
		u := queue[0]
		queue = queue[1:]
		doc, _, err := fetchDoc(ctx, f, u)
		if err != nil {
			if len(categories) == 0 && u == s.BaseURL()+"/" {
				return nil, nil, err
			}
			continue
		}
		doc.Find("a[href]").Each(func(_ int, a *goquery.Selection) {
			ref, err := url.Parse(parse.AbsURL(s.BaseURL(), attr(a, "href")))
			if err != nil || ref.Host != "www.hacker-motor-shop.com" {
				return
			}
			q := ref.Query()
			switch q.Get("a") {
			case "catalog":
				id := q.Get("p")
				if id == "" || seenCat[id] || q.Get("shop") != "" || hackerSkipRe.MatchString(ref.Path) {
					return
				}
				seenCat[id] = true
				link := hackerURL(ref, "catalog", "p", id)
				categories = append(categories, link)
				queue = append(queue, link)
			case "article":
				nr := q.Get("ProdNr")
				if nr == "" || seenProd[nr] || q.Get("shop") != "" {
					return
				}
				seenProd[nr] = true
				products = append(products, sitemap.URL{Loc: hackerURL(ref, "article", "ProdNr", nr)})
			}
		})
	}
	return categories, products, ctx.Err()
}

// hackerURL bouwt een vaste URL zonder sessie-id, sortering of categorie-context.
func hackerURL(ref *url.URL, action, key, val string) string {
	return "https://" + ref.Host + ref.Path + "?a=" + action + "&" + key + "=" + url.QueryEscape(val)
}

func hackerNormalize(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return raw
	}
	if nr := u.Query().Get("ProdNr"); nr != "" {
		return hackerURL(u, "article", "ProdNr", nr)
	}
	return raw
}

func hackerStock(sel *goquery.Selection) *bool {
	class := attr(sel.Find(".icon").First(), "class")
	return inStockFrom(strings.Contains(class, "gruen"), strings.Contains(class, "rot"))
}

func (s *Hacker) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	var out []parse.Product
	hint := strings.Join(hackerCrumbs(doc), " | ")
	doc.Find("article.item[data-prodnr]").Each(func(_ int, card *goquery.Selection) {
		link := card.Find("a.prodlink").First()
		p := parse.Product{
			ExternalID:   attr(card, "data-prodnr"),
			URL:          hackerNormalize(parse.AbsURL(s.BaseURL(), attr(link, "href"))),
			Name:         parse.Clean(card.Find(".productname .name").First().Text()),
			Brand:        parse.Clean(card.Find(".manufacturer a").First().Text()),
			ImageURL:     parse.AbsURL(s.BaseURL(), attr(card.Find("figure[data-src]").First(), "data-src")),
			Price:        parse.Price(card.Find(".itemprice .amount").First().Text()),
			InStock:      hackerStock(card.Find(".availability").First()),
			CategoryHint: hint,
		}
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	next := ""
	if a := doc.Find(`nav.pagenavigation a.button[href*="Start="][aria-label*="chsten Seite"]`).First(); a.Length() > 0 {
		next = parse.AbsURL(s.BaseURL(), attr(a, "href"))
	}
	return out, next
}

// hackerCrumbs leest de microdata-breadcrumbs zonder "Home".
func hackerCrumbs(doc *goquery.Document) []string {
	var out []string
	for _, c := range parse.MicrodataCrumbs(doc) {
		if c != "Home" {
			out = append(out, c)
		}
	}
	return out
}

func (s *Hacker) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	main := doc.Find("#product_detail_vue[data-prodnr]").First()
	if main.Length() == 0 {
		return nil
	}
	id := attr(main, "data-prodnr")
	p := &parse.Product{
		ExternalID:  id,
		URL:         hackerNormalize(firstNonEmpty(parse.Canonical(doc), pageURL)),
		Name:        parse.Clean(doc.Find("#headline").First().Text()),
		SKU:         id,
		Brand:       parse.Clean(main.Find(`[itemprop="brand"] [itemprop="name"]`).First().Text()),
		ImageURL:    parse.MetaContent(doc, "og:image"),
		Price:       parse.Price(main.Find(".itemprice .amount").First().Text()),
		Breadcrumbs: hackerCrumbs(doc),
	}
	// de laatste breadcrumb is het product zelf
	if n := len(p.Breadcrumbs); n > 0 && p.Breadcrumbs[n-1] == p.Name {
		p.Breadcrumbs = p.Breadcrumbs[:n-1]
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
