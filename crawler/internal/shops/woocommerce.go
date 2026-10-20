package shops

import (
	"context"
	"encoding/json"
	"html"
	"maps"
	"math"
	"net/url"
	"strconv"
	"strings"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/categorize"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
)

// Gedeelde helpers voor shops op WooCommerce.
//
//   - De openbare Store API (/wp-json/wc/store/v1/products, dezelfde die de blokken van het
//     thema gebruiken) geeft 100 producten per request met prijs (in centen), normale prijs,
//     voorraad, categorieën en foto's. Productpagina's bezoeken we dus niet.
//   - category=ID beperkt tot een categorie (inclusief subcategorieën); met
//     category_operator=not_in sluit je hem juist uit.
//   - orderby=id houdt de volgorde vast, zodat nieuwe producten tijdens een ronde niet alles
//     een plek opschuiven. Het totaal staat in de header X-WP-TotalPages; omdat de runner per
//     startpagina maximaal 50 pagina's volgt, starten we elke 50 pagina's een nieuwe reeks.

const wooPageSize = 100

// wooFeed is de basis-URL van de Store API met de vaste parameters (zonder page).
func wooFeed(baseURL string, extra url.Values) string {
	q := url.Values{
		"per_page": {strconv.Itoa(wooPageSize)},
		"orderby":  {"id"},
		"order":    {"asc"},
		"_fields":  {"id,name,sku,permalink,prices,is_in_stock,categories,images"},
	}
	maps.Copy(q, extra)
	return baseURL + "/wp-json/wc/store/v1/products?" + q.Encode()
}

// wooSeeds vraagt het aantal pagina's op en geeft een startpagina per 50 pagina's.
func wooSeeds(ctx context.Context, f *fetch.Fetcher, feed string) ([]string, error) {
	resp, err := f.Get(ctx, feed+"&page=1")
	if err != nil {
		return nil, err
	}
	pages, _ := strconv.Atoi(resp.Header.Get("X-WP-TotalPages"))
	seeds := []string{feed + "&page=1"}
	for p := 1 + maxPagesPerSeed; p <= pages; p += maxPagesPerSeed {
		seeds = append(seeds, feed+"&page="+strconv.Itoa(p))
	}
	return seeds, nil
}

// maxPagesPerSeed moet gelijk zijn aan maxListingPagesPerSeed in de runner.
const maxPagesPerSeed = 50

type wooProduct struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	SKU       string `json:"sku"`
	Permalink string `json:"permalink"`
	Prices    struct {
		Price        string `json:"price"`
		RegularPrice string `json:"regular_price"`
		MinorUnit    int    `json:"currency_minor_unit"`
		CurrencyCode string `json:"currency_code"`
	} `json:"prices"`
	IsInStock  bool `json:"is_in_stock"`
	Categories []struct {
		Name string `json:"name"`
	} `json:"categories"`
	Images []struct {
		Src string `json:"src"`
	} `json:"images"`
}

// parseWooFeed leest een pagina van de Store API. skip (mag nil zijn) slaat producten over
// op basis van hun categorienamen; keepCategory (mag nil zijn) bepaalt welke categorieën
// meetellen voor de indeling.
func parseWooFeed(pageURL string, body []byte, skip func(categories []string) bool, keepCategory func(string) bool) ([]parse.Product, string) {
	var items []wooProduct
	if err := json.Unmarshal(body, &items); err != nil {
		return nil, ""
	}
	var out []parse.Product
	for _, it := range items {
		if it.Prices.CurrencyCode != "EUR" {
			continue
		}
		var cats []string
		for _, c := range it.Categories {
			if name := parse.Clean(html.UnescapeString(c.Name)); keepCategory == nil || keepCategory(name) {
				cats = append(cats, name)
			}
		}
		if skip != nil && skip(cats) {
			continue
		}
		p := parse.Product{
			ExternalID:  strconv.FormatInt(it.ID, 10),
			URL:         it.Permalink,
			Name:        parse.Clean(html.UnescapeString(it.Name)),
			SKU:         it.SKU,
			Price:       wooMoney(it.Prices.Price, it.Prices.MinorUnit),
			Breadcrumbs: wooBreadcrumbs(cats),
		}
		if regular := wooMoney(it.Prices.RegularPrice, it.Prices.MinorUnit); regular > p.Price {
			p.OldPrice = regular
		}
		in := it.IsInStock
		p.InStock = &in
		if len(it.Images) > 0 {
			p.ImageURL = it.Images[0].Src
		}
		if p.Price > 0 && p.Name != "" && p.URL != "" {
			out = append(out, p)
		}
	}
	if len(items) < wooPageSize {
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

// wooMoney zet een bedrag in de kleinste eenheid ("1995", 2 decimalen) om naar euro's.
func wooMoney(minor string, unit int) float64 {
	n, err := strconv.ParseInt(minor, 10, 64)
	if err != nil {
		return 0
	}
	return math.Round(float64(n)/math.Pow10(unit)*100) / 100
}

// wooBreadcrumbs: WooCommerce geeft alle categorieën van een product zonder rangorde. Een
// bouwdoos staat vaak ook in "<merk> Onderdelen"; staat het product in een voertuigcategorie
// ("Kyosho Auto's"), dan is dat de juiste.
func wooBreadcrumbs(cats []string) []string {
	if len(cats) < 2 {
		return cats
	}
	for _, c := range cats {
		switch categorize.Classify([]string{c}, "", "", "") {
		case "drones", "helicopters", "vliegtuigen", "boten", "tanks", "werkvoertuigen", "rc-autos":
			return []string{c}
		}
	}
	return cats
}

// wooHasCategory meldt of een van de categorienamen sub bevat (hoofdletterongevoelig).
func wooHasCategory(cats []string, sub string) bool {
	for _, c := range cats {
		if strings.Contains(strings.ToLower(c), strings.ToLower(sub)) {
			return true
		}
	}
	return false
}
