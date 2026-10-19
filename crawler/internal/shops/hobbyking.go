package shops

import (
	"bytes"
	"context"
	"encoding/json"
	"math"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// HobbyKing is een grote internationale RC-webshop (Magento 2 met een Next.js-frontend). We
// nemen de Nederlandse winkel (/nl_nl/) met het EU-magazijn (stock_id 7, in Frankrijk).
//
//   - Valuta: standaard dollars. Met de cookies CURRENCY_CODE=EUR en COUNTRY_ID=NL (zoals de
//     valutakeuze op de site die zet) staan alle prijzen in euro's. Die worden met de
//     dollarkoers omgerekend, dus net als bij Banggood telt een prijsdaling pas vanaf
//     MinDealPercent als deal.
//   - Listings: categoriepagina's met ?page=N&rowsPerPage=100. De HTML bevat de producten als
//     JSON in de React Server Components-payload (self.__next_f.push): naam, sku, prijs
//     (final_price) en normale prijs (regular_price, de "van"-prijs) en voorraad per magazijn.
//     Productpagina's (1,4 MB per stuk, ~57.000 in de sitemap) bezoeken we dus niet.
//   - Categorieën: vaste lijst zonder overlap (de "alle ..."-pagina's per type plus de
//     onderdelen- en elektronicapagina's), met een label voor de indeling. Bargain Bin,
//     Brands Direct en New Items slaan we over: die overlappen met de rest.
type HobbyKing struct{}

const hobbykingStore = "https://hobbyking.com/nl_nl/"

func (*HobbyKing) Slug() string    { return "hobbyking" }
func (*HobbyKing) Name() string    { return "HobbyKing" }
func (*HobbyKing) BaseURL() string { return "https://hobbyking.com" }
func (*HobbyKing) Description() string {
	return "Grote internationale RC-webshop met eigen merken als Turnigy, Durafly, H-King en Avios: vliegtuigen, drones, accu's, motoren en onderdelen."
}

func (*HobbyKing) Cookie() string { return "CURRENCY_CODE=EUR; COUNTRY_ID=NL" }

func (*HobbyKing) UserAgent() string { return "" }

// MinDelay: elke listingpagina is ~2 MB server-side gerenderde HTML.
func (*HobbyKing) MinDelay() time.Duration { return 2 * time.Second }

// MinDealPercent ligt ruim boven wat de dollarkoers in een maand doet.
func (*HobbyKing) MinDealPercent() float64 { return 8 }

// hobbykingCategories: pad onder /nl_nl/ → label voor categorize.Classify ("" = op de naam).
var hobbykingCategories = []struct{ path, label string }{
	{"aircraft/planes/all-planes", "Planes"},
	{"aircraft/planes/plane-spare-parts", "Plane spare parts"},
	{"aircraft/helicopters/all-helicopters", "Helicopters"},
	{"aircraft/helicopters/spare-parts", "Helicopter spare parts"},
	{"aircraft/helicopters/helicopter-blades", "Helicopter blades"},
	{"aircraft/helicopters/helicopter-accessories", "Helicopter accessories"},
	{"aircraft/drones/ready-to-fly", "Drones"},
	{"aircraft/drones/almost-ready-to-fly", "Drones"},
	{"aircraft/drones/fpv-racing-drones", "Drones"},
	{"aircraft/drones/frame-kits", "Drones"},
	{"aircraft/drones/spare-parts", "Drone spare parts"},
	{"aircraft/drones/propellers", "Drone propellers"},
	{"aircraft/drones/drone-accessories", "Drone accessories"},
	{"aircraft/drones/motors-accessories", "Drone motor"},
	{"aircraft/drones/speed-controllers", "Drone ESC"},
	{"aircraft/drones/flight-controllers-accessories", "Flight controller"},
	{"cars/cars/all-cars", "RC cars"},
	{"cars/cars/spare-parts", "Car spare parts"},
	{"cars/boats/ready-to-run", "Boats"},
	{"cars/boats/parts-hardware", "Boat parts"},
	{"batteries-chargers", "Batteries chargers"},
	{"power-systems/electric-motors", "Motor"},
	{"power-systems/gas-glow-engines", "Motor"},
	{"power-systems/speed-controllers", "ESC"},
	{"power-systems/power-distribution", "Electronics"},
	{"power-systems/radio-servos/servos", "Servos"},
	{"power-systems/radio-servos/servos-accessories", "Servos"},
	{"power-systems/radio-servos/radios", "Transmitters"},
	{"power-systems/radio-servos/radio-accessories", ""},
	{"workbench/tools-bags-storage", "Tools"},
	{"workbench/glues-lubricants-tapes", "Lijm"},
	{"workbench/accessories", "Accessories"},
	{"workbench/hardware", ""},
}

const hobbykingPageSize = 100

func (s *HobbyKing) Discover(context.Context, *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	listings := make([]string, len(hobbykingCategories))
	for i, c := range hobbykingCategories {
		listings[i] = hobbykingPage(hobbykingStore+c.path+".html", 1)
	}
	return listings, nil, nil
}

func hobbykingPage(categoryURL string, page int) string {
	return categoryURL + "?page=" + strconv.Itoa(page) + "&rowsPerPage=" + strconv.Itoa(hobbykingPageSize)
}

// hobbykingLabel zoekt het label bij een listing-URL.
func hobbykingLabel(pageURL string) string {
	path := strings.TrimSuffix(strings.TrimPrefix(stripQuery(pageURL), hobbykingStore), ".html")
	for _, c := range hobbykingCategories {
		if c.path == path {
			return c.label
		}
	}
	return ""
}

var hobbykingFlightRe = regexp.MustCompile(`self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)`)

type hobbykingMoney struct {
	Value float64 `json:"value"`
}

type hobbykingItem struct {
	ID           int    `json:"id"`
	SKU          string `json:"sku"`
	Name         string `json:"name"`
	CanonicalURL string `json:"canonical_url"`
	PriceRange   struct {
		MinimumPrice struct {
			FinalPrice   hobbykingMoney `json:"final_price"`
			RegularPrice hobbykingMoney `json:"regular_price"`
		} `json:"minimum_price"`
	} `json:"price_range"`
	// Velden die de payload soms vervangt door een verwijzing ("$12:props:..."): los decoderen.
	WarehouseStatus []json.RawMessage `json:"warehouse_status"`
	Thumbnail       json.RawMessage   `json:"thumbnail"`
}

type hobbykingProducts struct {
	Items    []json.RawMessage `json:"items"`
	PageInfo *struct {
		CurrentPage int `json:"current_page"`
		TotalPages  int `json:"total_pages"`
	} `json:"page_info"`
}

// hobbykingEUStock is het EU-magazijn; de prijzen van de /nl_nl/-winkel horen daarbij.
const hobbykingEUStock = 7

// ParseListingRaw haalt de productlijst uit de Server Components-payload van een categoriepagina.
func (s *HobbyKing) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	var payload strings.Builder
	for _, m := range hobbykingFlightRe.FindAllSubmatch(body, -1) {
		var chunk string
		if json.Unmarshal(m[1], &chunk) == nil {
			payload.WriteString(chunk)
		}
	}
	list := hobbykingProductList(payload.String())
	if list == nil {
		return nil, ""
	}
	label := hobbykingLabel(pageURL)
	var out []parse.Product
	for _, raw := range list.Items {
		var it hobbykingItem
		if json.Unmarshal(raw, &it) != nil || it.Name == "" || it.CanonicalURL == "" {
			continue
		}
		price := it.PriceRange.MinimumPrice.FinalPrice.Value
		if price <= 0 {
			continue
		}
		p := parse.Product{
			ExternalID: strconv.Itoa(it.ID),
			URL:        hobbykingStore + strings.TrimPrefix(it.CanonicalURL, "/"),
			Name:       strings.TrimSpace(it.Name),
			SKU:        it.SKU,
			ImageURL:   hobbykingImage(it.Thumbnail),
			Price:      math.Round(price*100) / 100,
			InStock:    hobbykingInStock(it.WarehouseStatus),
		}
		if regular := math.Round(it.PriceRange.MinimumPrice.RegularPrice.Value*100) / 100; regular > p.Price {
			p.OldPrice = regular
		}
		if label != "" {
			p.Breadcrumbs = []string{label}
		}
		out = append(out, p)
	}
	next := ""
	if pi := list.PageInfo; pi != nil && pi.CurrentPage < pi.TotalPages {
		next = hobbykingPage(stripQuery(pageURL), pi.CurrentPage+1)
	}
	return out, next
}

// hobbykingProductList zoekt de productlijst met paginering; er staan soms ook andere
// productlijsten (sliders) zonder page_info op de pagina.
func hobbykingProductList(payload string) *hobbykingProducts {
	const marker = `"products":{"items":[`
	for rest := payload; ; {
		i := strings.Index(rest, marker)
		if i < 0 {
			return nil
		}
		start := i + len(`"products":`)
		var list hobbykingProducts
		if json.NewDecoder(strings.NewReader(rest[start:])).Decode(&list) == nil && list.PageInfo != nil {
			return &list
		}
		rest = rest[start:]
	}
}

func hobbykingInStock(warehouses []json.RawMessage) *bool {
	for _, raw := range warehouses {
		var w struct {
			StockID     int    `json:"stock_id"`
			StockStatus string `json:"stock_status"`
		}
		if json.Unmarshal(raw, &w) == nil && w.StockID == hobbykingEUStock {
			in := w.StockStatus == "IN_STOCK"
			return &in
		}
	}
	return nil
}

func hobbykingImage(raw json.RawMessage) string {
	var t struct {
		URL string `json:"url"`
	}
	if len(raw) == 0 || bytes.HasPrefix(raw, []byte(`"`)) || json.Unmarshal(raw, &t) != nil {
		return ""
	}
	if u, err := url.Parse(t.URL); err != nil || u.Scheme != "https" {
		return ""
	}
	return t.URL
}

// ParseListing wordt niet gebruikt: de producten staan als JSON in de pagina (zie ParseListingRaw).
func (s *HobbyKing) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *HobbyKing) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
