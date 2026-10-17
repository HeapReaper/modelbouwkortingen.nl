package shops

import (
	"context"
	"encoding/json"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/fetch"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/sitemap"
)

// Hoellein draait op Shopify.
//
//   - Listings: de openbare Shopify-feed /products.json?limit=250&page=N geeft per request
//     250 producten met alle varianten en prijzen. Shopify staat maximaal 25.000 producten
//     (100 pagina's) toe; we starten twee reeksen (pagina 1 en 51) omdat de runner per
//     startpagina maximaal 50 pagina's volgt.
//   - Productpagina's: /sitemap.xml → sitemap_products_N.xml (alleen de Duitse, niet /en/).
//     De pagina bevat JSON-LD (Product) en het Shopify product-id in de analytics-data.
type Hoellein struct{}

func (*Hoellein) Slug() string    { return "hoellein" }
func (*Hoellein) Name() string    { return "Hoellein" }
func (*Hoellein) BaseURL() string { return "https://hoelleinshop.com" }
func (*Hoellein) Description() string {
	return "Duitse modelvliegspecialist met motoren, regelaars, servo's, propellers en bouwmaterialen."
}

// Shopify (Cloudflare) geeft een 429 op een Chrome-user-agent met de TLS-handtekening van Go;
// met een eerlijke bot-user-agent gaat het wel goed.
func (*Hoellein) UserAgent() string {
	return "Mozilla/5.0 (compatible; ModelbouwkortingenBot/1.0; +https://modelbouwkortingen.nl/over)"
}

func (*Hoellein) MinDelay() time.Duration { return time.Second }

// Productpagina's zijn alleen een terugvaloptie: /products.json bevat alle prijzen al.
func (*Hoellein) MaxProductPages() int { return 300 }

const hoelleinFeed = "https://hoelleinshop.com/products.json?limit=250&page="

func (s *Hoellein) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	follow := func(u string) bool {
		return strings.Contains(u, "/sitemap_products_") && !strings.Contains(u, ".com/en/")
	}
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap.xml", follow)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var products []sitemap.URL
	for _, u := range urls {
		if strings.Contains(u.Loc, "/products/") {
			products = append(products, u)
		}
	}
	return []string{hoelleinFeed + "1", hoelleinFeed + "51"}, products, nil
}

type shopifyFeed struct {
	Products []struct {
		ID          int64    `json:"id"`
		Title       string   `json:"title"`
		Handle      string   `json:"handle"`
		Vendor      string   `json:"vendor"`
		ProductType string   `json:"product_type"`
		Tags        []string `json:"tags"`
		Variants    []struct {
			SKU       string `json:"sku"`
			Price     string `json:"price"`
			Available bool   `json:"available"`
		} `json:"variants"`
		Images []struct {
			Src string `json:"src"`
		} `json:"images"`
	} `json:"products"`
}

// ParseListingRaw leest een pagina van /products.json.
func (s *Hoellein) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	var feed shopifyFeed
	if err := json.Unmarshal(body, &feed); err != nil {
		return nil, ""
	}
	var out []parse.Product
	for _, sp := range feed.Products {
		p := parse.Product{
			ExternalID: strconv.FormatInt(sp.ID, 10),
			URL:        s.BaseURL() + "/products/" + sp.Handle,
			Name:       parse.Clean(sp.Title),
			Brand:      parse.Clean(sp.Vendor),
		}
		var tags []string
		for _, t := range sp.Tags {
			// interne tags als "dim_calculated" zeggen niets over de categorie
			if !strings.HasPrefix(t, "dim_") {
				tags = append(tags, t)
			}
		}
		p.CategoryHint = strings.Join(append([]string{sp.ProductType}, tags...), " | ")
		if len(sp.Images) > 0 {
			p.ImageURL = sp.Images[0].Src
		}
		// Laagste variantprijs, net als de JSON-LD offers op de productpagina.
		anyAvailable := false
		for i, v := range sp.Variants {
			price := parse.Price(v.Price)
			if price > 0 && (p.Price == 0 || price < p.Price) {
				p.Price = price
			}
			if i == 0 {
				p.SKU = v.SKU
			}
			anyAvailable = anyAvailable || v.Available
		}
		p.InStock = &anyAvailable
		if p.Price > 0 && p.Name != "" {
			out = append(out, p)
		}
	}
	// Een volle pagina betekent dat er mogelijk nog meer producten zijn.
	if len(feed.Products) < 250 {
		return out, ""
	}
	u, err := url.Parse(pageURL)
	if err != nil {
		return out, ""
	}
	q := u.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	q.Set("page", strconv.Itoa(page+1))
	u.RawQuery = q.Encode()
	return out, u.String()
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *Hoellein) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

var shopifyProductIDRe = regexp.MustCompile(`"product":\{"id":(\d+)`)

func (s *Hoellein) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	ld, _ := parse.JSONLD(doc)
	if ld == nil {
		return nil
	}
	html, _ := doc.Html()
	m := shopifyProductIDRe.FindStringSubmatch(html)
	if m == nil {
		return nil
	}
	p := &parse.Product{
		ExternalID: m[1],
		URL:        firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:       ld.Name,
		SKU:        ld.SKU,
		Brand:      ld.Brand,
		ImageURL:   firstNonEmpty(parse.MetaContent(doc, "og:image"), ld.Image),
		Price:      ld.Price,
		InStock:    parse.Availability(ld.Availability),
	}
	if p.Price == 0 {
		p.Price = parse.Price(parse.MetaContent(doc, "og:price:amount"))
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
