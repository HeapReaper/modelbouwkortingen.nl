package parse

import (
	"strings"
	"testing"

	"github.com/PuerkitoBio/goquery"
)

func TestPrice(t *testing.T) {
	cases := map[string]float64{
		"€ 1.234,56":         1234.56,
		"€459,-":             459,
		"&euro;&nbsp;849,00": 849,
		"849":                849,
		"3.45":               3.45,
		"799":                799,
		"€ 12.999,00":        12999,
		"1.234":              1234,
		"Excl. BTW:€329,75":  329.75,
		"":                   0,
		"69.99":              69.99,
	}
	for in, want := range cases {
		if got := Price(in); got != want {
			t.Errorf("Price(%q) = %v, want %v", in, got, want)
		}
	}
}

func TestJSONLDProductsItemList(t *testing.T) {
	html := `<script type="application/ld+json">{"@context":"https://schema.org","@type":"ItemList","itemListElement":[
		{"@type":"ListItem","position":1,"item":{"@type":"Product","name":"Truck","sku":"A1","brand":{"@type":"Brand","name":"ARRMA"},
			"image":["https://x/a.jpg"],"offers":{"@type":"Offer","price":"168.55","availability":"https://schema.org/InStock","url":"https://x/truck"}}},
		{"@type":"ListItem","position":2,"item":{"@type":"Product","name":"Buggy","url":"https://x/buggy","offers":{"price":"99"}}}]}</script>
	<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[{"name":"Home"},{"name":"Autos"}]}</script>`
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
	if err != nil {
		t.Fatal(err)
	}
	products, crumbs := JSONLDProducts(doc)
	if len(products) != 2 || len(crumbs) != 2 {
		t.Fatalf("got %d products, crumbs %v", len(products), crumbs)
	}
	p := products[0]
	if p.Name != "Truck" || p.Brand != "ARRMA" || p.Price != 168.55 || p.URL != "https://x/truck" || p.Image != "https://x/a.jpg" {
		t.Errorf("first product = %+v", p)
	}
	if products[1].URL != "https://x/buggy" || products[1].Price != 99 {
		t.Errorf("second product = %+v", products[1])
	}
}
