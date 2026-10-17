package shops

import (
	"context"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/fetch"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/sitemap"
)

// Droneshop draait op Magento 2 met het (oude) "yourstore" thema.
//
//   - Sitemap: /sitemap/sitemap.xml, één bestand. Producten staan direct onder de root (zonder
//     ".html") en hebben een <image:image>; categorieën en CMS-pagina's niet.
//   - Listings: de onderste categorieën onder /drones, /accessoires en /onderdelen (de bomen
//     /model en /merken tonen dezelfde producten nog een keer), plus /populair/aanbiedingen.
//     30 producten per pagina, paginering via a.action.next (?p=N; robots.txt staat dat toe).
//     Prijzen staan als data-price-type="finalPrice"/"oldPrice"; afbeeldingen lazy in data-original.
//   - Productpagina's hebben geen JSON-LD en geen breadcrumbs: prijs uit product:price:amount,
//     merk uit de specificatietabel. De categorie komt daarom uit de listings.
type Droneshop struct{}

func (*Droneshop) Slug() string    { return "droneshop" }
func (*Droneshop) Name() string    { return "Droneshop.nl" }
func (*Droneshop) BaseURL() string { return "https://droneshop.nl" }
func (*Droneshop) Description() string {
	return "Dronespecialist met camera-, FPV- en racedrones, plus accu's, propellers en onderdelen."
}

func (s *Droneshop) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap/sitemap.xml", nil)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var products []sitemap.URL
	var categories []string
	for _, u := range urls {
		switch {
		case strings.Contains(u.Loc, "/catalog/"):
			// /catalog/product/view/id/N zijn dubbelingen zonder nette URL
		case u.HasImage:
			products = append(products, u)
		case strings.HasPrefix(u.Loc, s.BaseURL()+"/drones/"),
			strings.HasPrefix(u.Loc, s.BaseURL()+"/accessoires/"),
			strings.HasPrefix(u.Loc, s.BaseURL()+"/onderdelen/"):
			categories = append(categories, u.Loc)
		}
	}
	listings := append([]string{s.BaseURL() + "/populair/aanbiedingen"}, leafCategories(categories, 2)...)
	return dedupe(listings), products, nil
}

func (s *Droneshop) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	var out []parse.Product
	var crumbs []string
	doc.Find(".breadcrumb_list li").Each(func(_ int, li *goquery.Selection) {
		if c := parse.Clean(li.Text()); c != "" && !li.HasClass("home") {
			crumbs = append(crumbs, c)
		}
	})
	hint := strings.Join(crumbs, " | ")
	if hint == "" {
		hint = parse.Clean(doc.Find("h1").First().Text())
	}
	// "Populair | Aanbiedingen" zegt niets over het product en zou als winkelcategorie blijven
	// hangen; zonder hint vult de eigen categoriepagina hem later in.
	if strings.Contains(pageURL, "/populair/") {
		hint = ""
	}
	doc.Find("li.product-item").Each(func(_ int, card *goquery.Selection) {
		link := card.Find("a.product-item-link").First()
		box := card.Find(".price-box").First()
		p := parse.Product{
			ExternalID:   firstNonEmpty(attr(card.Find(`input[name="product"]`).First(), "value"), attr(box, "data-product-id")),
			URL:          stripQuery(attr(link, "href")),
			Name:         parse.Clean(link.Text()),
			ImageURL:     attr(card.Find("img.product-image-photo").First(), "data-original"),
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

func (s *Droneshop) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	form := doc.Find("#product_addtocart_form").First()
	id := attr(form.Find(`input[name="product"]`).First(), "value")
	if id == "" {
		return nil
	}
	specs := map[string]string{}
	doc.Find("#product-attribute-specs-table td[data-th]").Each(func(_ int, td *goquery.Selection) {
		specs[strings.TrimSpace(attr(td, "data-th"))] = parse.Clean(td.Text())
	})
	main := doc.Find(".product-info-main").First()
	p := &parse.Product{
		ExternalID: id,
		URL:        firstNonEmpty(parse.Canonical(doc), parse.MetaContent(doc, "og:url"), stripQuery(pageURL)),
		Name:       firstNonEmpty(parse.Clean(main.Find("h1 .base").First().Text()), parse.MetaContent(doc, "og:title")),
		SKU:        firstNonEmpty(attr(form, "data-product-sku"), specs["Artikelnummer"]),
		Brand:      specs["Merk"],
		ImageURL:   parse.MetaContent(doc, "og:image"),
		Price:      parse.Price(parse.MetaContent(doc, "product:price:amount")),
	}
	// Alleen binnen .product-info-main zoeken: gerelateerde producten hebben ook prijzen en voorraad.
	stock := main.Find(".product-info-stock-sku .stock").First()
	p.InStock = inStockFrom(stock.HasClass("available"), stock.HasClass("unavailable"))
	box := main.Find(".product-info-price .price-box").First()
	if p.Price == 0 {
		p.Price = parse.Price(attr(box.Find(`[data-price-type="finalPrice"]`).First(), "data-price-amount"))
	}
	if old := parse.Price(attr(box.Find(`[data-price-type="oldPrice"]`).First(), "data-price-amount")); old > p.Price {
		p.OldPrice = old
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
