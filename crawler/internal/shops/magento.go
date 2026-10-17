package shops

import (
	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
)

// magentoListing leest de productkaarten (li.product-item) van een Magento 2-categoriepagina,
// zoals bij Droneshop en Bliek. Prijzen staan als data-price-type="finalPrice"/"oldPrice";
// de volgende pagina in a.action.next.
func magentoListing(doc *goquery.Document, hint string) ([]parse.Product, string) {
	var out []parse.Product
	doc.Find("li.product-item").Each(func(_ int, card *goquery.Selection) {
		link := card.Find("a.product-item-link").First()
		box := card.Find(".price-box").First()
		p := parse.Product{
			ExternalID:   firstNonEmpty(attr(card.Find(`input[name="product"]`).First(), "value"), attr(box, "data-product-id")),
			URL:          stripQuery(attr(link, "href")),
			Name:         parse.Clean(link.Text()),
			ImageURL:     imgSrc(card.Find("img.product-image-photo").First()),
			Price:        parse.Price(attr(box.Find(`[data-price-type="finalPrice"]`).First(), "data-price-amount")),
			OldPrice:     parse.Price(attr(box.Find(`[data-price-type="oldPrice"]`).First(), "data-price-amount")),
			CategoryHint: hint,
		}
		p.InStock = inStockFrom(card.Find("button.tocart").Length() > 0, card.Find(".stock.unavailable").Length() > 0)
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	return out, attr(doc.Find("a.action.next").First(), "href")
}
