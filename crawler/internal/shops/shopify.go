package shops

import (
	"encoding/json"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
)

// Gedeelde helpers voor shops op Shopify.
//
//   - De openbare feed /products.json?limit=250&page=N geeft per request 250 producten met
//     alle varianten en prijzen. Shopify staat maximaal 25.000 producten (100 pagina's) toe;
//     we starten twee reeksen (pagina 1 en 51) omdat de runner per startpagina maximaal
//     50 pagina's volgt.
//   - Shopify (Cloudflare) geeft een 429 op een Chrome-user-agent met de TLS-handtekening van Go;
//     met een eerlijke bot-user-agent gaat het wel goed.

const shopifyUserAgent = "Mozilla/5.0 (compatible; ModelbouwkortingenBot/1.0; +https://modelbouwkortingen.nl/over)"

func shopifyFeedSeeds(baseURL string) []string {
	feed := baseURL + "/products.json?limit=250&page="
	return []string{feed + "1", feed + "51"}
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
			SKU            string `json:"sku"`
			Price          string `json:"price"`
			CompareAtPrice string `json:"compare_at_price"`
			Available      bool   `json:"available"`
		} `json:"variants"`
		Images []struct {
			Src string `json:"src"`
		} `json:"images"`
	} `json:"products"`
}

// parseShopifyFeed leest een pagina van /products.json. keepTag bepaalt welke tags als
// categoriehint meetellen (nil = alle).
func parseShopifyFeed(baseURL, pageURL string, body []byte, keepTag func(string) bool) ([]parse.Product, string) {
	var feed shopifyFeed
	if err := json.Unmarshal(body, &feed); err != nil {
		return nil, ""
	}
	var out []parse.Product
	for _, sp := range feed.Products {
		p := parse.Product{
			ExternalID: strconv.FormatInt(sp.ID, 10),
			URL:        baseURL + "/products/" + sp.Handle,
			Name:       parse.Clean(sp.Title),
			Brand:      parse.Clean(sp.Vendor),
		}
		var tags []string
		for _, t := range sp.Tags {
			if keepTag == nil || keepTag(t) {
				tags = append(tags, t)
			}
		}
		p.CategoryHint = strings.Join(append([]string{sp.ProductType}, tags...), " | ")
		if len(sp.Images) > 0 {
			p.ImageURL = sp.Images[0].Src
		}
		// Laagste variantprijs, net als de offers op de productpagina.
		anyAvailable := false
		for i, v := range sp.Variants {
			price := parse.Price(v.Price)
			if price > 0 && (p.Price == 0 || price < p.Price) {
				p.Price = price
				p.OldPrice = parse.Price(v.CompareAtPrice)
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
	// Shopify laat soms producten weg, waardoor ook een pagina vóór het einde minder dan 250
	// producten kan hebben; pas een lege pagina betekent dat we klaar zijn.
	if len(feed.Products) == 0 {
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

// shopifyProductIDRe vindt het Shopify product-id in de analytics-data van een productpagina.
var shopifyProductIDRe = regexp.MustCompile(`"product":\{"id":(\d+)`)
