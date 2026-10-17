package shops

import (
	"context"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/fetch"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/sitemap"
)

// Aerobertics (België) draait op een eigen ASP.NET-shopsysteem, zonder sitemap.
//
//   - Categorieën: het menu op /nl/homepage (/nl/catalog/<groep>/<categorie>). Een groep toont
//     ook alle producten van zijn subcategorieën, dus we nemen alleen de onderste. Merkpagina's
//     (/by-brand/), "Nieuwe artikelen", "Promoties" en cadeaubonnen tonen alleen dubbele of geen
//     RC-producten.
//   - Listings: 24 per pagina, paginering via ?Page=N (a.page-link met data-action). Elke
//     .product-card heeft een GUID (data-product-id), de prijs incl. btw in .price strong en
//     bij korting de oude prijs in .previous-price.
//   - Productpagina's bezoeken we niet: de listings bevatten alle data.
type Aerobertics struct{}

func (*Aerobertics) Slug() string    { return "aerobertics" }
func (*Aerobertics) Name() string    { return "Aerobertics" }
func (*Aerobertics) BaseURL() string { return "https://aerobertics.be" }
func (*Aerobertics) Description() string {
	return "Belgische RC-specialist met een groot aanbod vliegtuigen, helikopters, auto's en boten, plus elektronica en aandrijvingen."
}

var (
	aeroCategoryRe = regexp.MustCompile(`^/nl/catalog/[^/?#]+(/[^/?#]+)?$`)
	aeroSkipRe     = regexp.MustCompile(`^/nl/catalog/by-brand/|/(nieuwe-artikelen|promoties|cadeaubonnen|promotie-materiaal)$`)
)

func (s *Aerobertics) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	doc, _, err := fetchDoc(ctx, f, s.BaseURL()+"/nl/homepage")
	if err != nil {
		return nil, nil, err
	}
	var categories []string
	doc.Find("a[href]").Each(func(_ int, a *goquery.Selection) {
		href := attr(a, "href")
		if aeroCategoryRe.MatchString(href) && !aeroSkipRe.MatchString(href) {
			categories = append(categories, s.BaseURL()+href)
		}
	})
	return leafCategories(dedupe(categories), 3), nil, nil
}

func (s *Aerobertics) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	var crumbs []string
	doc.Find("ol.breadcrumb li").Each(func(i int, li *goquery.Selection) {
		if c := parse.Clean(li.Text()); i > 0 && c != "" { // 0 = "Home"
			crumbs = append(crumbs, c)
		}
	})
	hint := strings.Join(crumbs, " | ")
	var out []parse.Product
	doc.Find(".products-list-grid .product-card").Each(func(_ int, card *goquery.Selection) {
		price := card.Find(".price-container .price").First()
		stock := card.Find(".stock .status-dot").First()
		p := parse.Product{
			ExternalID:   attr(card, "data-product-id"),
			URL:          stripQuery(attr(card.Find("a.desc").First(), "href")),
			Name:         parse.Clean(card.Find("a.desc").First().Text()),
			SKU:          parse.Clean(card.Find(".product-header .name").First().Text()),
			Brand:        attr(card.Find("img.brand").First(), "alt"),
			ImageURL:     imgSrc(card.Find("a.product-image img").First()),
			Price:        parse.Price(price.Find("strong").First().Text()),
			OldPrice:     parse.Price(price.Find(".previous-price").First().Text()),
			InStock:      inStockFrom(stock.HasClass("bg-success") || stock.HasClass("bg-warning"), stock.HasClass("bg-danger")),
			CategoryHint: hint,
		}
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	return out, aeroNextPage(pageURL, doc)
}

// aeroNextPage zoekt in de paginering de link naar pagina <huidige+1>.
func aeroNextPage(pageURL string, doc *goquery.Document) string {
	cur := 1
	if u, err := url.Parse(pageURL); err == nil {
		if n, err := strconv.Atoi(u.Query().Get("Page")); err == nil {
			cur = n
		}
	}
	want := strconv.Itoa(cur + 1)
	next := ""
	doc.Find("#pager a.page-link").EachWithBreak(func(_ int, a *goquery.Selection) bool {
		if attr(a, "data-action") == want {
			next = strings.SplitN(attr(a, "href"), "#", 2)[0]
			return false
		}
		return true
	})
	return next
}

// ParseProduct wordt niet gebruikt: we bezoeken geen productpagina's (zie boven).
func (s *Aerobertics) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
