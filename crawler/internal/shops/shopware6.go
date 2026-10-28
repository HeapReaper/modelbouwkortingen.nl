package shops

import (
	"context"
	"net/url"
	"sort"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Gedeelde helpers voor shops op Shopware 6, zoals Lindinger en RC-Car-Online.
//
//   - Listings: elke productkaart is een .card.product-box met de product-UUID in
//     input[name="lineItems[<id>][id]"]. In .product-price staat de prijs; een doorgestreepte
//     adviesprijs zit daarin als .list-price. Paginering via ?p=N (data-page in de paginering).
//   - Productpagina's hebben schema.org-microdata: productID (dezelfde UUID), sku, prijs,
//     availability en BreadcrumbList.

// sw6SitemapCategories haalt de categorieën uit de sitemap: standaard eindigen categorie-URL's
// in Shopware 6 op "/". We nemen alleen de onderste categorieën, omdat een categorie vaak ook de
// producten van haar subcategorieën toont; producten die alleen aan een bovenliggende categorie
// hangen, missen we zo. skip krijgt het pad zonder baseURL, bv. "Producten/Auto-s/".
func sw6SitemapCategories(ctx context.Context, f *fetch.Fetcher, sitemapURL, baseURL, query string, skip func(path string) bool) ([]string, error) {
	urls, err := sitemap.Fetch(ctx, f, sitemapURL, nil)
	if err != nil && len(urls) == 0 {
		return nil, err
	}
	var cats []string
	for _, u := range urls {
		path, ok := strings.CutPrefix(u.Loc, baseURL+"/")
		if ok && path != "" && strings.HasSuffix(path, "/") && (skip == nil || !skip(path)) {
			cats = append(cats, path)
		}
	}
	sort.Strings(cats)
	cats = dedupe(cats)
	var out []string
	for i, c := range cats {
		// Gesorteerd staat een subcategorie direct na haar ouder.
		if i+1 < len(cats) && strings.HasPrefix(cats[i+1], c) {
			continue
		}
		out = append(out, baseURL+"/"+c+query)
	}
	return out, nil
}

// sw6NavCategories leest de onderste categorieën uit de flyout-menu's van de hoofdnavigatie
// (standaardthema), voor shops waarvan de sitemap categorieën en producten niet onderscheidt.
// top is de categorie van de flyout zelf.
func sw6NavCategories(ctx context.Context, f *fetch.Fetcher, pageURL, query string, skip func(top, name string) bool) ([]string, error) {
	doc, _, err := fetchDoc(ctx, f, pageURL)
	if err != nil {
		return nil, err
	}
	var out []string
	doc.Find(".navigation-flyout").Each(func(_ int, fly *goquery.Selection) {
		top := parse.Clean(attr(fly.Find(".navigation-flyout-category-link a").First(), "title"))
		fly.Find("a.navigation-flyout-link").Each(func(_ int, a *goquery.Selection) {
			// Een categorie met subcategorieën heeft die in de .navigation-flyout-categories ernaast.
			if a.NextFiltered(".navigation-flyout-categories").Find("a.navigation-flyout-link").Length() > 0 {
				return
			}
			name := parse.Clean(firstNonEmpty(attr(a, "title"), a.Text()))
			if href := stripQuery(attr(a, "href")); href != "" && (skip == nil || !skip(top, name)) {
				out = append(out, href+query)
			}
		})
	})
	return dedupe(out), nil
}

// inStock bepaalt de voorraadstatus van een kaart; nil gebruikt sw6InStock. Met detailOnly
// tellen ook kaarten zonder bestelknop mee (alleen een "Details"-knop); hun UUID staat dan in
// input[name="product-id"].
func sw6ParseListing(pageURL string, doc *goquery.Document, inStock func(card *goquery.Selection) *bool, detailOnly bool) ([]parse.Product, string) {
	if inStock == nil {
		inStock = sw6InStock
	}
	hint := strings.Join(parse.MicrodataCrumbs(doc), " | ")
	// Productsliders elders op de pagina ("Beliebte Produkte") horen niet bij de listing.
	cards := doc.Find(".cms-element-product-listing .card.product-box")
	if cards.Length() == 0 {
		cards = doc.Find(".card.product-box")
	}
	var out []parse.Product
	cards.Each(func(_ int, card *goquery.Selection) {
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
		if p.ExternalID == "" && detailOnly {
			p.ExternalID = attr(card.Find(`input[name="product-id"]`).First(), "value")
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

// sw6InStock leest de schema.org-availability van een kaart, of anders het statusbolletje
// (.availability-indicator: indicator-available, -limited of -unavailable).
func sw6InStock(card *goquery.Selection) *bool {
	if in := parse.Availability(attr(card.Find(`[itemprop="availability"]`).First(), "href")); in != nil {
		return in
	}
	class := attr(card.Find(".availability-indicator").First(), "class")
	if !strings.Contains(class, "indicator-") {
		return nil
	}
	in := !strings.Contains(class, "indicator-unavailable")
	return &in
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
	// Een uitgeschakelde "volgende"-knop bevat soms toch het nummer van de volgende pagina.
	if doc.Find(`.pagination .page-item:not(.disabled) [data-page="`+next+`"], .pagination .page-item:not(.disabled) input[name="p"][value="`+next+`"]`).Length() == 0 {
		return ""
	}
	q.Set("p", next)
	u.RawQuery = q.Encode()
	return u.String()
}

func sw6ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	// Sommige thema's laten de microdata weg; dan lezen we de buybox en de meta-tags.
	form := doc.Find("#productDetailPageBuyProductForm").First()
	id := firstNonEmpty(
		attr(doc.Find(`meta[itemprop="productID"]`).First(), "content"),
		attr(form.Find(`input[name^="lineItems["][name$="][id]"]`).First(), "value"),
	)
	box := doc.Find(".product-detail-price-container").First()
	if id == "" || box.Length() == 0 {
		return nil
	}
	crumbs := parse.MicrodataCrumbs(doc)
	if len(crumbs) == 0 {
		doc.Find("ol.breadcrumb .breadcrumb-title").Each(func(_ int, t *goquery.Selection) {
			if c := parse.Clean(t.Text()); c != "" {
				crumbs = append(crumbs, c)
			}
		})
	}
	p := &parse.Product{
		ExternalID:  id,
		URL:         firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:        parse.Clean(doc.Find("h1.product-detail-name").First().Text()),
		SKU:         parse.Clean(firstNonEmpty(doc.Find(`[itemprop="sku"]`).First().Text(), doc.Find(".product-detail-ordernumber").First().Text())),
		Brand:       firstNonEmpty(attr(doc.Find(`[itemprop="brand"] meta[itemprop="name"]`).First(), "content"), parse.MetaContent(doc, "product:brand")),
		ImageURL:    stripQuery(parse.MetaContent(doc, "og:image")),
		Price:       parse.Price(firstNonEmpty(attr(box.Find(`meta[itemprop="price"]`).First(), "content"), parse.MetaContent(doc, "product:price:amount"))),
		InStock:     parse.Availability(attr(doc.Find(`link[itemprop="availability"]`).First(), "href")),
		Breadcrumbs: crumbs,
	}
	if p.InStock == nil {
		p.InStock = sw6DeliveryStatus(doc.Find(".delivery-information").First())
	}
	if old := parse.Price(box.Find(".list-price-price").First().Text()); old > p.Price {
		p.OldPrice = old
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}

// sw6DeliveryStatus leest de levertijd-regel van de buybox: delivery-available is op voorraad;
// delivery-restock ("Versandfertig in N Tagen"), -soldout en -preorder niet.
func sw6DeliveryStatus(s *goquery.Selection) *bool {
	class := attr(s, "class")
	if !strings.Contains(class, "delivery-") {
		return nil
	}
	in := strings.Contains(class, "delivery-available")
	return &in
}
