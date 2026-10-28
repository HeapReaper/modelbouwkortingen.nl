package shops

import (
	"net/url"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
)

// Gedeelde helpers voor shops op Shopware 6, zoals Lindinger en RC-Car-Online.
//
//   - Listings: elke productkaart is een .card.product-box met de product-UUID in
//     input[name="lineItems[<id>][id]"]. In .product-price staat de prijs; een doorgestreepte
//     adviesprijs zit daarin als .list-price. Paginering via ?p=N (data-page in de paginering).
//   - Productpagina's hebben schema.org-microdata: productID (dezelfde UUID), sku, prijs,
//     availability en BreadcrumbList.

// inStock bepaalt de voorraadstatus van een kaart; nil gebruikt de schema.org-availability.
func sw6ParseListing(pageURL string, doc *goquery.Document, inStock func(card *goquery.Selection) *bool) ([]parse.Product, string) {
	if inStock == nil {
		inStock = func(card *goquery.Selection) *bool {
			return parse.Availability(attr(card.Find(`[itemprop="availability"]`).First(), "href"))
		}
	}
	hint := strings.Join(parse.MicrodataCrumbs(doc), " | ")
	var out []parse.Product
	doc.Find(".card.product-box").Each(func(_ int, card *goquery.Selection) {
		link := card.Find("a.product-name").First()
		price := card.Find(".product-price").First()
		old := parse.Price(price.Find(".list-price-price").First().Text())
		cur := price.Clone()
		cur.Find(".list-price").Remove()
		p := parse.Product{
			ExternalID:   attr(card.Find(`input[name^="lineItems["][name$="][id]"]`).First(), "value"),
			URL:          stripQuery(attr(link, "href")),
			Name:         parse.Clean(firstNonEmpty(attr(link, "title"), link.Text())),
			Brand:        attr(card.Find(`input[name="brand-name"]`).First(), "value"),
			ImageURL:     stripQuery(imgSrc(card.Find("img.product-image").First())),
			Price:        parse.Price(cur.Text()),
			InStock:      inStock(card),
			CategoryHint: hint,
		}
		if old > p.Price {
			p.OldPrice = old
		}
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	if len(out) == 0 {
		return out, ""
	}
	return out, sw6NextPage(pageURL, doc)
}

// sw6NextPage geeft dezelfde URL met p=<huidige+1> als de paginering die pagina kent.
func sw6NextPage(pageURL string, doc *goquery.Document) string {
	u, err := url.Parse(pageURL)
	if err != nil {
		return ""
	}
	q := u.Query()
	cur, _ := strconv.Atoi(q.Get("p"))
	if cur < 1 {
		cur = 1
	}
	next := strconv.Itoa(cur + 1)
	if doc.Find(`.pagination [data-page="`+next+`"], .pagination input[name="p"][value="`+next+`"]`).Length() == 0 {
		return ""
	}
	q.Set("p", next)
	u.RawQuery = q.Encode()
	return u.String()
}

func sw6ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	id := attr(doc.Find(`meta[itemprop="productID"]`).First(), "content")
	box := doc.Find(".product-detail-price-container").First()
	if id == "" || box.Length() == 0 {
		return nil
	}
	crumbs := parse.MicrodataCrumbs(doc)
	p := &parse.Product{
		ExternalID:  id,
		URL:         firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:        parse.Clean(doc.Find("h1.product-detail-name").First().Text()),
		SKU:         parse.Clean(doc.Find(`[itemprop="sku"]`).First().Text()),
		Brand:       attr(doc.Find(`[itemprop="brand"] meta[itemprop="name"]`).First(), "content"),
		ImageURL:    stripQuery(parse.MetaContent(doc, "og:image")),
		Price:       parse.Price(attr(box.Find(`meta[itemprop="price"]`).First(), "content")),
		InStock:     parse.Availability(attr(doc.Find(`link[itemprop="availability"]`).First(), "href")),
		Breadcrumbs: crumbs,
	}
	if old := parse.Price(box.Find(".list-price-price").First().Text()); old > p.Price {
		p.OldPrice = old
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
