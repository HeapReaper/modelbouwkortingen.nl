package shops

import (
	"context"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// MiniZShop draait op WordPress + WooCommerce met een eigen thema.
//
//   - robots.txt vraagt Crawl-delay: 10 (de fetcher houdt zich daaraan) en verbiedt /wp-json/,
//     dus de WooCommerce Store API is geen optie.
//   - Sitemap: /minizshop-sitemap.xml → -products-N.xml (/product/) en -product-categories-1.xml.
//   - Listings: onderste categorieën, 36 producten per pagina, paginering via ?product-page=N.
//     Prijzen staan in de standaard WooCommerce .price (met <del>/<ins> bij aanbiedingen).
//   - Productpagina's: JSON-LD Product + BreadcrumbList; het post-id staat in body.postid-N.
//     Door de Crawl-delay halen we per ronde maar weinig productpagina's op.
type MiniZShop struct{}

func (*MiniZShop) Slug() string    { return "minizshop" }
func (*MiniZShop) Name() string    { return "Mini-Zshop" }
func (*MiniZShop) BaseURL() string { return "https://mini-zshop.nl" }
func (*MiniZShop) Description() string {
	return "Specialist in Kyosho Mini-Z en kleine RC-auto's, met veel onderdelen en Traxxas-parts."
}

// Met 10 seconden per request kost een productpagina veel tijd; de prijzen komen uit de listings.
func (*MiniZShop) MaxProductPages() int { return 300 }

func (s *MiniZShop) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	follow := func(u string) bool {
		return strings.Contains(u, "-sitemap-products-") || strings.Contains(u, "-sitemap-product-categories-")
	}
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/minizshop-sitemap.xml", follow)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var products []sitemap.URL
	var categories []string
	for _, u := range urls {
		switch {
		case strings.Contains(u.Loc, "/product/"):
			products = append(products, u)
		case strings.Contains(u.Loc, "/product-categorie/"):
			categories = append(categories, u.Loc)
		}
	}
	return leafCategories(categories, 2), products, nil
}

var postIDRe = regexp.MustCompile(`\bpost(?:id)?-(\d+)\b`)

func (s *MiniZShop) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	var out []parse.Product
	hint := parse.Clean(doc.Find("h1").First().Text())
	doc.Find("div.product.type-product").Each(func(_ int, card *goquery.Selection) {
		class := attr(card, "class")
		link := card.Find("a.woocommerce-loop-product__title").First()
		price, old := woocommercePrices(card.Find(".price").First())
		p := parse.Product{
			URL:          stripQuery(attr(link, "href")),
			Name:         parse.Clean(link.Text()),
			Price:        price,
			OldPrice:     old,
			CategoryHint: hint,
		}
		if m := postIDRe.FindStringSubmatch(class); m != nil {
			p.ExternalID = m[1]
		}
		if img := imgSrc(card.Find(".main-img img").First()); !strings.Contains(img, "placeholder") {
			p.ImageURL = img
		}
		p.InStock = inStockFrom(strings.Contains(class, " instock"), strings.Contains(class, " outofstock"))
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	return out, minizNextPage(pageURL, doc)
}

// minizNextPage zoekt de link naar ?product-page=<huidige+1>.
func minizNextPage(pageURL string, doc *goquery.Document) string {
	cur := 1
	if u, err := url.Parse(pageURL); err == nil {
		if n, err := strconv.Atoi(u.Query().Get("product-page")); err == nil {
			cur = n
		}
	}
	want := "product-page=" + strconv.Itoa(cur+1)
	next := ""
	doc.Find(`a[href*="product-page="]`).EachWithBreak(func(_ int, a *goquery.Selection) bool {
		href := attr(a, "href")
		if strings.HasSuffix(href, want) || strings.Contains(href, want+"&") {
			next = href
			return false
		}
		return true
	})
	return next
}

func (s *MiniZShop) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	ld, crumbs := parse.JSONLD(doc)
	if ld == nil {
		return nil
	}
	m := postIDRe.FindStringSubmatch(attr(doc.Find("body").First(), "class"))
	if m == nil {
		return nil
	}
	// eerste (Home) en laatste (het product zelf) breadcrumb zijn niet interessant
	if len(crumbs) > 2 {
		crumbs = crumbs[1 : len(crumbs)-1]
	}
	for i, c := range crumbs {
		crumbs[i] = parse.Clean(c) // de shop escapet "&" dubbel ("&amp;amp;")
	}
	p := &parse.Product{
		ExternalID: m[1],
		URL:        firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:       ld.Name,
		SKU:        ld.SKU,
		Brand:      ld.Brand,
		// og:image is op deze site een algemene banner
		ImageURL:    ld.Image,
		Price:       parse.Price(parse.MetaContent(doc, "product:price:amount")),
		InStock:     parse.Availability(ld.Availability),
		Breadcrumbs: crumbs,
	}
	if p.Price == 0 {
		p.Price = ld.Price
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
