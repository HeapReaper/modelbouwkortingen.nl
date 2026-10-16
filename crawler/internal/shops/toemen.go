package shops

import (
	"context"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/fetch"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/sitemap"
)

// Toemen draait op WordPress + WooCommerce (Yoast sitemaps).
//
//   - Sitemap: /sitemap.xml → product-sitemapN.xml (producten) en product_cat-sitemapN.xml (categorieën).
//   - Prijzen staan als <del>oude prijs</del><ins>nieuwe prijs</ins> in .price, zowel op
//     categoriepagina's als op productpagina's.
//   - Paginering (/page/2/) en filters zijn via robots.txt verboden, dus alleen pagina 1 per categorie.
type Toemen struct{}

func (*Toemen) Slug() string    { return "toemen" }
func (*Toemen) Name() string    { return "Toemen Modelsport" }
func (*Toemen) BaseURL() string { return "https://www.toemen.nl" }
func (*Toemen) Description() string {
	return "Modelsportwinkel in Oisterwijk met een enorm assortiment RC, occasions en onderdelen."
}

func (s *Toemen) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	follow := func(u string) bool {
		return strings.Contains(u, "product-sitemap") || strings.Contains(u, "product_cat-sitemap")
	}
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap.xml", follow)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	listings := discoverSaleLinks(ctx, f, s.BaseURL()+"/", func(u string) bool {
		return strings.Contains(u, "/product/") || strings.Contains(u, "?")
	})
	var products []sitemap.URL
	for _, u := range urls {
		if strings.Contains(u.Loc, "/product/") {
			products = append(products, u)
		} else {
			listings = append(listings, u.Loc)
		}
	}
	return dedupe(listings), products, nil
}

var (
	toemenPostIDRe   = regexp.MustCompile(`\bpost-(\d+)\b`)
	toemenCategoryRe = gtmFieldRe("item_category")
	toemenCat2Re     = gtmFieldRe("item_category_2")
)

// woocommercePrices leest <del>/<ins> uit een .price element.
func woocommercePrices(price *goquery.Selection) (current, old float64) {
	if price.Length() == 0 {
		return 0, 0
	}
	if ins := price.Find("ins .amount").First(); ins.Length() > 0 {
		current = parse.Price(ins.Text())
		old = parse.Price(price.Find("del .amount").First().Text())
		return current, old
	}
	amounts := price.Find(".amount")
	if amounts.Length() > 1 {
		// prijsrange (variabel product): neem de laagste, geen oude prijs
		current = parse.Price(amounts.First().Text())
		return current, 0
	}
	return parse.Price(amounts.First().Text()), 0
}

func (s *Toemen) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	var out []parse.Product
	pageHint := strings.Join(parse.MicrodataCrumbs(doc), " | ")
	if pageHint == "" {
		pageHint = parse.Clean(doc.Find("h1").First().Text())
	}
	doc.Find("li.product.type-product").Each(func(_ int, card *goquery.Selection) {
		class := attr(card, "class")
		link := card.Find("a.woocommerce-loop-product__link").First()
		price, old := woocommercePrices(card.Find(".price").First())
		img := card.Find("noscript img").First()
		if img.Length() == 0 {
			img = card.Find("img").First()
		}
		p := parse.Product{
			URL:      stripQuery(attr(link, "href")),
			Name:     parse.Clean(card.Find(".woocommerce-loop-product__title").First().Text()),
			ImageURL: imgSrc(img),
			Price:    price,
			OldPrice: old,
		}
		if m := toemenPostIDRe.FindStringSubmatch(class); m != nil {
			p.ExternalID = m[1]
		}
		html, _ := card.Html()
		var hints []string
		if pageHint != "" {
			hints = append(hints, pageHint)
		}
		if m := toemenCat2Re.FindStringSubmatch(html); m != nil {
			hints = append(hints, unescapeJSONString(m[1]))
		}
		if m := toemenCategoryRe.FindStringSubmatch(html); m != nil {
			hints = append(hints, unescapeJSONString(m[1]))
		}
		p.CategoryHint = strings.Join(hints, " | ")
		switch {
		case strings.Contains(class, "outofstock"):
			f := false
			p.InStock = &f
		case strings.Contains(class, "instock"):
			t := true
			p.InStock = &t
		}
		if p.URL != "" && p.Name != "" && p.Price > 0 {
			if p.ExternalID == "" {
				p.ExternalID = p.URL
			}
			out = append(out, p)
		}
	})
	return out, ""
}

var toemenShortlinkRe = regexp.MustCompile(`[?&]p=(\d+)`)

func (s *Toemen) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	ld, crumbs := parse.JSONLD(doc)
	if ld == nil {
		return nil
	}
	main := doc.Find(`div[id^="product-"].type-product`).First()
	id := ""
	if m := toemenPostIDRe.FindStringSubmatch(attr(main, "class")); m != nil {
		id = m[1]
	} else if m := toemenShortlinkRe.FindStringSubmatch(attr(doc.Find(`link[rel="shortlink"]`).First(), "href")); m != nil {
		id = m[1]
	}
	if id == "" {
		return nil
	}
	summary := main.Find(".summary").First()
	if summary.Length() == 0 {
		summary = main
	}
	price, old := woocommercePrices(summary.Find("p.price").First())
	if price == 0 {
		price = parse.Price(parse.MetaContent(doc, "product:price:amount"))
	}
	if price == 0 {
		price = ld.Price
	}
	if c := parse.MicrodataCrumbs(doc); len(c) > 0 {
		crumbs = c
	}
	// eerste (Home) en laatste (het product zelf) breadcrumb zijn niet interessant
	if len(crumbs) > 2 {
		crumbs = crumbs[1 : len(crumbs)-1]
	}
	p := &parse.Product{
		ExternalID:  id,
		URL:         firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:        ld.Name,
		SKU:         ld.SKU,
		Brand:       ld.Brand,
		ImageURL:    firstNonEmpty(parse.MetaContent(doc, "og:image"), ld.Image),
		Price:       price,
		OldPrice:    old,
		InStock:     parse.Availability(ld.Availability),
		Breadcrumbs: crumbs,
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
