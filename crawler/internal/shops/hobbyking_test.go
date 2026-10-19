package shops

import (
	"encoding/json"
	"testing"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/categorize"
)

// hobbykingHTML verpakt een Server Components-payload zoals de site hem in stukken uitlevert.
func hobbykingHTML(t *testing.T, parts ...string) []byte {
	t.Helper()
	html := "<html><body>"
	for _, p := range parts {
		chunk, err := json.Marshal(p)
		if err != nil {
			t.Fatal(err)
		}
		html += `<script>self.__next_f.push([1,` + string(chunk) + `])</script>`
	}
	return []byte(html + "</body></html>")
}

func TestHobbyKingListing(t *testing.T) {
	slider := `"products":{"items":[{"id":1,"sku":"X","name":"Slider","canonical_url":"slider.html","price_range":{"minimum_price":{"final_price":{"value":5}}}}]}`
	item := func(id, name, url, final, regular, eu string) string {
		return `{"id":` + id + `,"sku":"931067` + id + `","name":"` + name + `","canonical_url":"` + url + `",` +
			`"price_range":{"minimum_price":{"final_price":{"currency":"EUR","value":` + final + `},"regular_price":{"currency":"EUR","value":` + regular + `}}},` +
			`"warehouse_status":[{"stock_id":7,"stock_status":"` + eu + `"},{"stock_id":8,"stock_status":"IN_STOCK"}],` +
			`"thumbnail":{"url":"https://cdn-global.hobbyking.com/media/catalog/product/x.jpg"}}`
	}
	list := `"products":{"items":[` +
		item("88437", "Avios (PNF) PBY Catalina 1900mm", "avios-pby.html", "150.040001", "176.210001", "IN_STOCK") + `,` +
		item("88438", "Durafly Tundra 1300mm", "durafly-tundra.html", "99.990001", "99.990001", "OUT_OF_STOCK") + `,` +
		`"$12:props:children:0"` +
		`],"page_info":{"current_page":1,"page_size":100,"total_pages":2},"total_count":104}`
	// De lijst loopt over twee push-stukken heen, de slider zonder page_info staat ervoor.
	body := hobbykingHTML(t, `1:{`+slider+`}`, `2:{`+list[:120], list[120:]+`}`)

	s := &HobbyKing{}
	pageURL := "https://hobbyking.com/nl_nl/aircraft/planes/all-planes.html?page=1&rowsPerPage=100"
	products, next := s.ParseListingRaw(pageURL, body)
	if len(products) != 2 {
		t.Fatalf("producten = %d, want 2: %+v", len(products), products)
	}
	if want := "https://hobbyking.com/nl_nl/aircraft/planes/all-planes.html?page=2&rowsPerPage=100"; next != want {
		t.Errorf("next = %q, want %q", next, want)
	}
	p := products[0]
	if p.ExternalID != "88437" || p.SKU != "93106788437" || p.URL != "https://hobbyking.com/nl_nl/avios-pby.html" {
		t.Errorf("id/sku/url = %q %q %q", p.ExternalID, p.SKU, p.URL)
	}
	if p.Price != 150.04 || p.OldPrice != 176.21 {
		t.Errorf("prijs = %v van %v, want 150.04 van 176.21", p.Price, p.OldPrice)
	}
	if p.InStock == nil || !*p.InStock || p.ImageURL == "" {
		t.Errorf("voorraad/foto = %v %q", p.InStock, p.ImageURL)
	}
	if got := categorize.Classify(p.Breadcrumbs, p.CategoryHint, p.URL, p.Name); got != "vliegtuigen" {
		t.Errorf("categorie = %q, want vliegtuigen", got)
	}
	q := products[1]
	if q.OldPrice != 0 || q.InStock == nil || *q.InStock {
		t.Errorf("tweede product: van %v, voorraad %v; want geen van-prijs, niet op voorraad (EU-magazijn)", q.OldPrice, q.InStock)
	}

	if products, next := s.ParseListingRaw(pageURL, []byte("<html></html>")); products != nil || next != "" {
		t.Errorf("lege pagina: %v %q", products, next)
	}
}

// Elk label moet in de bedoelde categorie vallen, ook bij een productnaam die niets zegt.
func TestHobbyKingLabels(t *testing.T) {
	want := map[string]string{
		"Planes": "vliegtuigen", "Plane spare parts": "onderdelen", "Helicopters": "helicopters",
		"Helicopter spare parts": "onderdelen", "Helicopter blades": "onderdelen",
		"Helicopter accessories": "onderdelen", "Drones": "drones", "Drone spare parts": "onderdelen",
		"Drone propellers": "onderdelen", "Drone accessories": "onderdelen", "Drone motor": "elektronica",
		"Drone ESC": "elektronica", "Flight controller": "elektronica", "RC cars": "rc-autos",
		"Car spare parts": "onderdelen", "Boats": "boten", "Boat parts": "onderdelen",
		"Batteries chargers": "accus-laders", "Motor": "elektronica", "ESC": "elektronica",
		"Electronics": "elektronica", "Servos": "elektronica", "Transmitters": "zenders",
		"Tools": "gereedschap", "Lijm": "gereedschap", "Accessories": "onderdelen",
	}
	for _, c := range hobbykingCategories {
		if c.label == "" {
			continue
		}
		if got := categorize.Classify([]string{c.label}, "", "https://hobbyking.com/nl_nl/x.html", "Item 123"); got != want[c.label] {
			t.Errorf("%s (%s) → %q, want %q", c.path, c.label, got, want[c.label])
		}
	}
}
