package shops

import (
	"net/url"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
)

// Gedeelde helpers voor shops op Shopware 5, zoals Premium-Modellbau en CopterFarm.
//
//   - Sitemap: /web/sitemap/shop-1/sitemap-1.xml.gz met producten, categorieën (eindigen op
//     "/") en merkpagina's (één niveau diep, ook met "/").
//   - Listings: ?n=48 (het grootste aantal per pagina), paginering via ?p=N (a.paging--next).
//     Productkaarten in de listing hebben data-page-index; kaarten zonder (slider met
//     topsellers) slaan we over. Het artikelnummer staat in data-ordernumber, de prijs in
//     .price--default en een doorgestreepte prijs in .price--discount.

const sw5Query = "?n=48"

func sw5ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	hint := strings.Join(parse.MicrodataCrumbs(doc), " | ")
	var out []parse.Product
	doc.Find(".product--box[data-ordernumber]").Each(func(_ int, card *goquery.Selection) {
		if attr(card, "data-page-index") == "" {
			return
		}
		link := card.Find("a.product--title").First()
		img := card.Find(".product--image img").First()
		image := imgSrc(img)
		if srcset := attr(img, "data-srcset"); image == "" && srcset != "" {
			image = srcsetFirst(srcset)
		}
		p := parse.Product{
			ExternalID:   attr(card, "data-ordernumber"),
			URL:          stripQuery(attr(link, "href")),
			Name:         parse.Clean(firstNonEmpty(attr(link, "title"), link.Text())),
			SKU:          attr(card, "data-ordernumber"),
			ImageURL:     image,
			Price:        parse.Price(card.Find(".price--default").First().Text()),
			CategoryHint: hint,
		}
		if old := parse.Price(card.Find(".price--discount").First().Text()); old > p.Price {
			p.OldPrice = old
		}
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	if len(out) == 0 || doc.Find("a.paging--next").Length() == 0 {
		return out, ""
	}
	u, err := url.Parse(pageURL)
	if err != nil {
		return out, ""
	}
	q := u.Query()
	cur, _ := strconv.Atoi(q.Get("p"))
	q.Set("p", strconv.Itoa(max(cur, 1)+1))
	u.RawQuery = q.Encode()
	return out, u.String()
}

// sw5ParseProduct leest een productpagina (schema.org-microdata in .product--detail-upper).
func sw5ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	sku := parse.Clean(doc.Find(`[itemprop="sku"]`).First().Text())
	price := parse.Price(attr(doc.Find(`meta[itemprop="price"]`).First(), "content"))
	if sku == "" || price == 0 {
		return nil
	}
	crumbs := parse.MicrodataCrumbs(doc)
	p := &parse.Product{
		ExternalID:  sku,
		URL:         firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:        parse.Clean(doc.Find("h1.product--title").First().Text()),
		SKU:         sku,
		Brand:       attr(doc.Find(`meta[itemprop="brand"]`).First(), "content"),
		ImageURL:    parse.MetaContent(doc, "og:image"),
		Price:       price,
		InStock:     parse.Availability(attr(doc.Find(`link[itemprop="availability"]`).First(), "href")),
		Breadcrumbs: crumbs,
	}
	if old := parse.Price(doc.Find(".product--price .price--line-through").First().Text()); old > p.Price {
		p.OldPrice = old
	}
	if p.Name == "" {
		return nil
	}
	return p
}
