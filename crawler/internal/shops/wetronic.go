package shops

import (
	"context"
	"net/url"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/fetch"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/sitemap"
)

// Wetronic (wetronics.nl verwijst door naar wetronic.nl) draait op OpenCart met het Journal thema.
//
//   - Sitemap (uit robots.txt): uksb_sitemaps; de "images" sitemaps bevatten alle producten.
//   - De aanbiedingenpagina (route=product/special) mag volgens robots.txt gecrawld worden,
//     inclusief paginering. Daar staan .price-old en .price-new per product.
//   - Productpagina's hebben .product-price-old/.product-price-new of .product-price.
type Wetronic struct{}

func (*Wetronic) Slug() string    { return "wetronic" }
func (*Wetronic) Name() string    { return "Wetronic" }
func (*Wetronic) BaseURL() string { return "https://wetronic.nl" }
func (*Wetronic) Description() string {
	return "Modelbouwspecialist met veel vliegtuigen, zenders, elektronica en onderdelen."
}

const wetronicSpecials = "https://wetronic.nl/index.php?route=product/special&limit=100"

func (s *Wetronic) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	follow := func(u string) bool { return strings.Contains(u, "uksb_sitemaps/images") }
	urls, err := sitemap.Fetch(ctx, f, "https://wetronic.nl/index.php?route=extension/feed/uksb_sitemaps/google&store=0", follow)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var products []sitemap.URL
	for _, u := range urls {
		if strings.Contains(u.Loc, "index.php") {
			continue
		}
		products = append(products, u)
	}
	return []string{wetronicSpecials}, products, nil
}

func wetronicBrand(sel *goquery.Selection) string {
	return parse.Clean(sel.Find(".stat-2 a, .product-manufacturer a, .brand a").First().Text())
}

func (s *Wetronic) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	var out []parse.Product
	doc.Find(".product-layout[data-product-id]").Each(func(_ int, card *goquery.Selection) {
		link := card.Find(".name a").First()
		priceBox := card.Find(".price").First()
		p := parse.Product{
			ExternalID: attr(card, "data-product-id"),
			URL:        stripQuery(attr(link, "href")),
			Name:       parse.Clean(link.Text()),
			Brand:      wetronicBrand(card),
			ImageURL:   imgSrc(card.Find(".product-img img, .image img").First()),
		}
		if newP := priceBox.Find(".price-new"); newP.Length() > 0 {
			p.Price = parse.Price(newP.Text())
			p.OldPrice = parse.Price(priceBox.Find(".price-old").Text())
		} else {
			clone := priceBox.Clone()
			clone.Find(".price-tax, .product-labels-price").Remove()
			p.Price = parse.Price(clone.Text())
		}
		if p.URL != "" && p.Name != "" && p.Price > 0 && p.ExternalID != "" {
			out = append(out, p)
		}
	})

	next := ""
	if href := attr(doc.Find(`link[rel="next"]`).First(), "href"); href != "" {
		if u, err := url.Parse(href); err == nil {
			q := u.Query()
			q.Set("limit", "100")
			u.RawQuery = q.Encode()
			next = u.String()
		}
	}
	return out, next
}

func (s *Wetronic) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	id := attr(doc.Find("#product-id").First(), "value")
	if id == "" {
		return nil
	}
	ld, crumbs := parse.JSONLD(doc)
	if len(crumbs) > 1 {
		crumbs = crumbs[1:] // "Wetronic Modelbouw" (home)
	}
	group := doc.Find(".product-info .product-price-group, .product-price-group").First()
	p := &parse.Product{
		ExternalID:  id,
		URL:         firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:        firstNonEmpty(parse.Clean(doc.Find(".product-info .title, h1").First().Text()), parse.MetaContent(doc, "og:title")),
		Brand:       wetronicBrand(doc.Find(".product-info, .product-details").First()),
		ImageURL:    parse.MetaContent(doc, "og:image"),
		Breadcrumbs: crumbs,
	}
	if newP := group.Find(".product-price-new"); newP.Length() > 0 {
		p.Price = parse.Price(newP.First().Text())
		p.OldPrice = parse.Price(group.Find(".product-price-old").First().Text())
	} else {
		p.Price = parse.Price(group.Find(".product-price").First().Text())
	}
	if ld != nil {
		if p.Name == "" {
			p.Name = ld.Name
		}
		if p.Price == 0 {
			p.Price = ld.Price
		}
		p.InStock = parse.Availability(ld.Availability)
	}
	if stock := strings.ToLower(doc.Find(".product-stock").First().Text()); stock != "" && p.InStock == nil {
		in := strings.Contains(stock, "op voorraad") && !strings.Contains(stock, "niet op voorraad")
		p.InStock = &in
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
