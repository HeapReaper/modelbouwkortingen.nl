// Package parse bevat generieke helpers om productdata uit HTML te halen:
// prijzen, JSON-LD, OpenGraph en breadcrumbs.
package parse

import (
	"bytes"
	"encoding/json"
	"html"
	"math"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/PuerkitoBio/goquery"

	"golang.org/x/net/html/charset"
)

// Product is wat een shop-parser over één product teruggeeft.
type Product struct {
	ExternalID   string
	URL          string
	Name         string
	SKU          string
	Brand        string
	ImageURL     string
	Price        float64
	OldPrice     float64 // 0 = onbekend / niet in de aanbieding
	InStock      *bool
	Breadcrumbs  []string
	CategoryHint string // extra context voor de categorie-indeling (bv. listing-URL)
}

var priceRe = regexp.MustCompile(`\d[\d.,\s\x{00a0}]*(?:,-)?`)

// Price zet teksten als "€ 1.234,56", "€459,-", "849.00" of "3.45" om naar een float.
func Price(s string) float64 {
	s = html.UnescapeString(s)
	m := priceRe.FindString(s)
	if m == "" {
		return 0
	}
	m = strings.NewReplacer(" ", "", " ", "", ",-", "").Replace(strings.TrimSpace(m))
	m = strings.TrimRight(m, ".,")
	lastComma := strings.LastIndex(m, ",")
	lastDot := strings.LastIndex(m, ".")
	switch {
	case lastComma >= 0 && lastDot >= 0:
		if lastComma > lastDot { // 1.234,56
			m = strings.ReplaceAll(m, ".", "")
			m = strings.Replace(m, ",", ".", 1)
		} else { // 1,234.56
			m = strings.ReplaceAll(m, ",", "")
		}
	case lastComma >= 0:
		if strings.Count(m, ",") == 1 && len(m)-lastComma-1 <= 2 {
			m = strings.Replace(m, ",", ".", 1) // 849,00
		} else {
			m = strings.ReplaceAll(m, ",", "") // 1,234,567
		}
	case lastDot >= 0:
		// "1.234" (NL duizendtal) vs "12.34": drie cijfers na de punt = duizendtal
		if strings.Count(m, ".") > 1 || len(m)-lastDot-1 == 3 {
			m = strings.ReplaceAll(m, ".", "")
		}
	}
	v, err := strconv.ParseFloat(m, 64)
	if err != nil || math.IsNaN(v) || v < 0 {
		return 0
	}
	return math.Round(v*100) / 100
}

// Clean normaliseert whitespace en HTML-entities.
func Clean(s string) string {
	s = html.UnescapeString(s)
	return strings.Join(strings.Fields(s), " ")
}

// MetaContent geeft de content van <meta property|name=...>.
func MetaContent(doc *goquery.Document, key string) string {
	v, _ := doc.Find(`meta[property="` + key + `"], meta[name="` + key + `"]`).First().Attr("content")
	return Clean(v)
}

// Canonical geeft de canonical URL van de pagina, of "".
func Canonical(doc *goquery.Document) string {
	v, _ := doc.Find(`link[rel="canonical"]`).First().Attr("href")
	return strings.TrimSpace(v)
}

// JSONLDProduct bevat de velden uit een schema.org Product blok die we gebruiken.
type JSONLDProduct struct {
	Name         string
	URL          string
	SKU          string
	Brand        string
	Image        string
	Price        float64
	Availability string
}

// JSONLD zoekt het eerste schema.org Product en de BreadcrumbList in de pagina.
func JSONLD(doc *goquery.Document) (*JSONLDProduct, []string) {
	products, crumbs := JSONLDProducts(doc)
	if len(products) == 0 {
		return nil, crumbs
	}
	return products[0], crumbs
}

// JSONLDProducts geeft alle schema.org Products in de pagina, ook die in een ItemList (zoals
// op categoriepagina's), en de langste BreadcrumbList.
func JSONLDProducts(doc *goquery.Document) ([]*JSONLDProduct, []string) {
	var products []*JSONLDProduct
	var crumbs []string
	var visit func(obj map[string]any)
	visit = func(obj map[string]any) {
		switch typeOf(obj) {
		case "product":
			products = append(products, jsonldProduct(obj))
		case "itemlist":
			items, _ := obj["itemListElement"].([]any)
			for _, it := range items {
				if m, ok := it.(map[string]any); ok {
					if item, ok := m["item"].(map[string]any); ok {
						m = item
					}
					visit(m)
				}
			}
		case "breadcrumblist":
			// Sommige shops hebben meerdere lijsten (bv. "Home > Winkel" naast het echte pad).
			if c := jsonldCrumbs(obj); len(c) > len(crumbs) {
				crumbs = c
			}
		}
	}
	doc.Find(`script[type="application/ld+json"]`).Each(func(_ int, s *goquery.Selection) {
		var raw any
		// Sommige shops zetten letterlijke newlines in strings; die maken we eerst onschadelijk.
		txt := strings.NewReplacer("\n", " ", "\r", " ", "\t", " ").Replace(s.Text())
		if err := json.Unmarshal([]byte(txt), &raw); err != nil {
			return
		}
		walkJSONLD(raw, visit)
	})
	return products, crumbs
}

func walkJSONLD(v any, fn func(map[string]any)) {
	switch t := v.(type) {
	case []any:
		for _, x := range t {
			walkJSONLD(x, fn)
		}
	case map[string]any:
		fn(t)
		if g, ok := t["@graph"]; ok {
			walkJSONLD(g, fn)
		}
	}
}

func typeOf(obj map[string]any) string {
	switch t := obj["@type"].(type) {
	case string:
		return strings.ToLower(t)
	case []any:
		for _, x := range t {
			if s, ok := x.(string); ok {
				return strings.ToLower(s)
			}
		}
	}
	return ""
}

func str(v any) string {
	switch t := v.(type) {
	case string:
		return Clean(t)
	case float64:
		return strconv.FormatFloat(t, 'f', -1, 64)
	case []any:
		if len(t) > 0 {
			return str(t[0])
		}
	case map[string]any:
		if n, ok := t["name"]; ok {
			return str(n)
		}
		if u, ok := t["url"]; ok {
			return str(u)
		}
	}
	return ""
}

func jsonldProduct(obj map[string]any) *JSONLDProduct {
	p := &JSONLDProduct{
		Name:  str(obj["name"]),
		SKU:   str(obj["sku"]),
		Brand: str(obj["brand"]),
		Image: str(obj["image"]),
		URL:   str(obj["url"]),
	}
	var offers []any
	switch o := obj["offers"].(type) {
	case []any:
		offers = o
	case map[string]any:
		offers = []any{o}
	}
	for _, o := range offers {
		m, ok := o.(map[string]any)
		if !ok {
			continue
		}
		price := Price(str(m["price"]))
		if price == 0 {
			price = Price(str(m["lowPrice"]))
		}
		// Yoast WooCommerce SEO zet de prijs in priceSpecification.
		if price == 0 {
			if spec, ok := m["priceSpecification"].([]any); ok && len(spec) > 0 {
				if sm, ok := spec[0].(map[string]any); ok {
					price = Price(str(sm["price"]))
				}
			} else if sm, ok := m["priceSpecification"].(map[string]any); ok {
				price = Price(str(sm["price"]))
			}
		}
		if price > 0 && (p.Price == 0 || price < p.Price) {
			p.Price = price
		}
		if p.Availability == "" {
			p.Availability = str(m["availability"])
		}
		if p.URL == "" {
			p.URL = str(m["url"])
		}
	}
	return p
}

func jsonldCrumbs(obj map[string]any) []string {
	items, _ := obj["itemListElement"].([]any)
	var out []string
	for _, it := range items {
		m, ok := it.(map[string]any)
		if !ok {
			continue
		}
		name := str(m["name"])
		if name == "" {
			name = str(m["item"])
		}
		if name != "" {
			out = append(out, name)
		}
	}
	return out
}

// MicrodataCrumbs leest breadcrumbs die met schema.org microdata zijn opgemaakt.
func MicrodataCrumbs(doc *goquery.Document) []string {
	var out []string
	doc.Find(`[itemtype*="BreadcrumbList"] [itemprop="itemListElement"]`).Each(func(_ int, s *goquery.Selection) {
		if n := Clean(s.Find(`[itemprop="name"]`).First().Text()); n != "" {
			out = append(out, n)
		}
	})
	return out
}

// Availability vertaalt schema.org availability naar een bool (nil = onbekend).
func Availability(s string) *bool {
	s = strings.ToLower(s)
	if s == "" {
		return nil
	}
	in := strings.Contains(s, "instock") || strings.Contains(s, "limitedavailability") || strings.Contains(s, "preorder")
	return &in
}

// AbsURL maakt een (mogelijk relatieve) URL absoluut t.o.v. base.
func AbsURL(base, ref string) string {
	ref = strings.TrimSpace(ref)
	if ref == "" || strings.HasPrefix(ref, "http://") || strings.HasPrefix(ref, "https://") {
		return ref
	}
	if strings.HasPrefix(ref, "//") {
		return "https:" + ref
	}
	base = strings.TrimRight(base, "/")
	return base + "/" + strings.TrimLeft(ref, "/")
}

// Document parset een HTML-pagina en zet daarbij een afwijkende tekenset (bv. Windows-1252)
// om naar UTF-8, op basis van de Content-Type header of de <meta charset> in de pagina.
func Document(body []byte, contentType string) (*goquery.Document, error) {
	// Zonder charset in de header en met geldige UTF-8 niets omzetten: de detectie kijkt
	// alleen naar de eerste 1024 bytes en valt anders terug op Windows-1252.
	if !strings.Contains(strings.ToLower(contentType), "charset") && utf8.Valid(body) {
		return goquery.NewDocumentFromReader(bytes.NewReader(body))
	}
	r, err := charset.NewReader(bytes.NewReader(body), contentType)
	if err != nil {
		r = bytes.NewReader(body)
	}
	return goquery.NewDocumentFromReader(r)
}
