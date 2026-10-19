package shops

import (
	"testing"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/categorize"
)

func TestWooCommerceFeed(t *testing.T) {
	item := func(id, name, price, regular, stock, cats string) string {
		return `{"id":` + id + `,"name":"` + name + `","sku":"SKU` + id + `","permalink":"https://www.the-border.com/product/p` + id + `/",` +
			`"prices":{"price":"` + price + `","regular_price":"` + regular + `","sale_price":"` + price + `","currency_code":"EUR","currency_minor_unit":2},` +
			`"is_in_stock":` + stock + `,"categories":[` + cats + `],"images":[{"src":"https://www.the-border.com/wp-content/uploads/p` + id + `.jpg"}]}`
	}
	cat := func(name string) string { return `{"id":1,"name":"` + name + `"}` }
	body := []byte(`[` +
		item("1", "Traxxas Black Front Lower Suspension Arm (L&#038;R) 13631", "805", "1496", "false", cat("Traxxas Stampede VX3 Onderdelen")) + `,` +
		item("2", "Kyosho Inferno MP11E 1/8 4WD Buggy Kit", "95901", "95901", "true", cat("Kyosho Auto&#039;s")+`,`+cat("Kyosho Onderdelen")+`,`+cat("Offroad Auto Bouwdozen")) + `,` +
		item("3", "Carrera Digital Spoorwissel", "2995", "2995", "true", cat("Accessory for Slotcars")) +
		`]`)
	pageURL := "https://www.the-border.com/wp-json/wc/store/v1/products?order=asc&orderby=id&page=3&per_page=100"
	products, next := (&TheBorder{}).ParseListingRaw(pageURL, body)
	if len(products) != 2 {
		t.Fatalf("got %d producten, want 2 (slotcar overgeslagen)", len(products))
	}
	if next != "" {
		t.Errorf("next = %q, want leeg (minder dan 100 producten)", next)
	}
	p := products[0]
	if p.ExternalID != "1" || p.SKU != "SKU1" || p.Name != "Traxxas Black Front Lower Suspension Arm (L&R) 13631" {
		t.Errorf("id/sku/naam = %q %q %q", p.ExternalID, p.SKU, p.Name)
	}
	if p.Price != 8.05 || p.OldPrice != 14.96 || p.InStock == nil || *p.InStock || p.ImageURL == "" {
		t.Errorf("prijs %v van %v, voorraad %v, foto %q", p.Price, p.OldPrice, p.InStock, p.ImageURL)
	}
	if got := categorize.Classify(p.Breadcrumbs, p.CategoryHint, p.URL, p.Name); got != "onderdelen" {
		t.Errorf("categorie onderdeel = %q", got)
	}
	// Een bouwdoos die ook in "Kyosho Onderdelen" staat is toch een auto.
	q := products[1]
	if q.OldPrice != 0 || q.Price != 959.01 {
		t.Errorf("bouwdoos: prijs %v van %v", q.Price, q.OldPrice)
	}
	if got := categorize.Classify(q.Breadcrumbs, q.CategoryHint, q.URL, q.Name); got != "rc-autos" {
		t.Errorf("categorie bouwdoos = %q, want rc-autos", got)
	}

	// Een volle pagina verwijst naar de volgende.
	full := []byte(`[`)
	for i := range wooPageSize {
		if i > 0 {
			full = append(full, ',')
		}
		full = append(full, item("9", "Tamiya TT-02 Upright", "590", "590", "true", cat("Tamiya Onderdelen"))...)
	}
	full = append(full, ']')
	_, next = (&SpeelgoedenModelbouw{}).ParseListingRaw(pageURL, full)
	if want := "https://www.the-border.com/wp-json/wc/store/v1/products?order=asc&orderby=id&page=4&per_page=100"; next != want {
		t.Errorf("next = %q, want %q", next, want)
	}
}

func TestSpeelgoedenModelbouwSkipsStatic(t *testing.T) {
	body := []byte(`[{"id":1,"name":"Tamiya Mercedes-Benz 300 SL 1:24 (bouwpakket)","permalink":"https://www.speelgoedenmodelbouw.com/product/x/",` +
		`"prices":{"price":"5890","regular_price":"5890","currency_code":"EUR","currency_minor_unit":2},"is_in_stock":true,` +
		`"categories":[{"name":"R/C"},{"name":"Tamiya Statische Modelbouw"}]}]`)
	if products, _ := (&SpeelgoedenModelbouw{}).ParseListingRaw("https://www.speelgoedenmodelbouw.com/wp-json/wc/store/v1/products?page=1", body); len(products) != 0 {
		t.Errorf("statische bouwdoos niet overgeslagen: %v", products)
	}
}
