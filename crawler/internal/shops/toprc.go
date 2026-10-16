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

// TopRC draait op Magento 2 met het Hyvä thema.
//
//   - Sitemap: /sitemap/sitemap.xml → producten eindigen op ".html", de rest zijn categorieën.
//   - Categoriepagina's tonen per product data-price-type="finalPrice" en "oldPrice".
//     Paginering (?p=2) is via robots.txt verboden, dus we pakken alleen pagina 1 van elke
//     (sub)categorie; dat zijn er ruim 2000, dus dat dekt veel af.
//   - Productpagina's tonen de oude prijs pas via JavaScript, daar halen we de actuele
//     prijs, breadcrumbs en het merk vandaan. Prijsdalingen zien we via de prijshistorie.
type TopRC struct{}

func (*TopRC) Slug() string    { return "toprc" }
func (*TopRC) Name() string    { return "TopRC" }
func (*TopRC) BaseURL() string { return "https://www.toprc.nl" }
func (*TopRC) Description() string {
	return "Grote RC-specialist met auto's, helicopters, vliegtuigen, boten en onderdelen."
}

func (s *TopRC) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap/sitemap.xml", nil)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	listings := []string{s.BaseURL() + "/aanbiedingen/"}
	listings = append(listings, discoverSaleLinks(ctx, f, s.BaseURL()+"/", func(u string) bool { return strings.Contains(u, "?") })...)
	var products []sitemap.URL
	for _, u := range urls {
		switch {
		case strings.HasSuffix(u.Loc, ".html"):
			products = append(products, u)
		case strings.HasSuffix(u.Loc, "/") && u.Loc != s.BaseURL()+"/" && !strings.Contains(u.Loc, "/tweedehands"):
			listings = append(listings, u.Loc)
		}
	}
	return dedupe(listings), products, nil
}

var (
	toprcCategoryRe = gtmFieldRe("item_category")
	toprcBrandRe    = gtmFieldRe("item_brand")
	toprcSkuRe      = gtmFieldRe("item_sku")
	toprcPathRe     = regexp.MustCompile(`"list_name":"Product View","category":"((?:[^"\\]|\\.)*)"`)
)

func (s *TopRC) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	var out []parse.Product
	hint := strings.Join(parse.MicrodataCrumbs(doc), " | ")
	doc.Find("form.product-item").Each(func(_ int, card *goquery.Selection) {
		link := card.Find(".product-item-name a, a.product-item-photo").First()
		p := parse.Product{
			ExternalID: attr(card.Find(`input[name="product"]`).First(), "value"),
			URL:        stripQuery(attr(link, "href")),
			Name:       parse.Clean(card.Find(".product-item-name").First().Text()),
			ImageURL:   imgSrc(card.Find("img.product-image-photo").First()),
			Price:      parse.Price(attr(card.Find(`[data-price-type="finalPrice"]`).First(), "data-price-amount")),
			OldPrice:   parse.Price(attr(card.Find(`[data-price-type="oldPrice"]`).First(), "data-price-amount")),
		}
		html, _ := card.Html()
		if m := toprcCategoryRe.FindStringSubmatch(html); m != nil {
			p.CategoryHint = unescapeJSONString(m[1])
		}
		if hint != "" {
			p.CategoryHint = strings.TrimSpace(hint + " | " + p.CategoryHint)
		}
		if p.CategoryHint == "" {
			p.CategoryHint = pageURL
		}
		if m := toprcBrandRe.FindStringSubmatch(html); m != nil {
			p.Brand = unescapeJSONString(m[1])
		}
		if m := toprcSkuRe.FindStringSubmatch(html); m != nil {
			p.SKU = unescapeJSONString(m[1])
		}
		if stock := strings.ToLower(card.Find(".stock-status-new").Text()); stock != "" {
			in := strings.Contains(stock, "op voorraad")
			p.InStock = &in
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

func (s *TopRC) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	ld, _ := parse.JSONLD(doc)
	id := attr(doc.Find(`#product_addtocart_form input[name="product"]`).First(), "value")
	if ld == nil || id == "" {
		return nil
	}
	p := &parse.Product{
		ExternalID: id,
		URL:        firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:       ld.Name,
		SKU:        ld.SKU,
		Brand:      ld.Brand,
		ImageURL:   firstNonEmpty(parse.MetaContent(doc, "og:image"), ld.Image),
		Price:      parse.Price(parse.MetaContent(doc, "product:price:amount")),
		InStock:    parse.Availability(ld.Availability),
	}
	if p.Price == 0 {
		p.Price = ld.Price
	}
	html, _ := doc.Html()
	if m := toprcPathRe.FindStringSubmatch(html); m != nil {
		for _, c := range strings.Split(unescapeJSONString(m[1]), "/") {
			if c = strings.TrimSpace(c); c != "" && !strings.EqualFold(c, "Aanbiedingen") {
				p.Breadcrumbs = append(p.Breadcrumbs, c)
			}
		}
	}
	// Mocht het thema de oude prijs ooit server-side renderen, dan pakken we die mee.
	main := doc.Find(".product-info-main, .product-info").First()
	if old := parse.Price(attr(main.Find(`[data-price-type="oldPrice"]`).First(), "data-price-amount")); old > p.Price {
		p.OldPrice = old
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if strings.TrimSpace(v) != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}

func dedupe(in []string) []string {
	seen := map[string]bool{}
	out := in[:0]
	for _, s := range in {
		if !seen[s] {
			seen[s] = true
			out = append(out, s)
		}
	}
	return out
}
