package shops

import (
	"context"
	"regexp"
	"strings"
	"sync"

	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/fetch"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/sitemap"
)

// Area51 (area51-rc.es, Spanje) draait op PrestaShop 1.4 met een eigen thema; vooral een
// helikopterspecialist (Align, SAB, BeastX), met ook vliegtuigen, auto's, drones en accu's.
//
//   - robots.txt staat in /shop/ (in de root geeft hij 404) en verbiedt niets.
//   - Categorieën: de boom in #categories_block_left (~1.250 knopen). PrestaShop 1.4 toont per
//     categorie alleen de producten die er direct aan hangen, dus we bezoeken álle knopen, niet
//     alleen de onderste. De breadcrumb op een categoriepagina noemt alleen de categorie zelf;
//     het volledige pad uit de boom ("RC Heli Kits & Parts > ALIGN-RC > T-Rex 100 > Parts")
//     onthouden we per categorie als categoriehint. Overgeslagen: "New Products" en "Specials"
//     (alleen dubbele producten), merchandise, vlieglessen, cadeaubonnen en slotcars.
//   - Listings: 50 per pagina met ?n=50, paginering via #pagination_next (?n=50&p=N). Kaarten
//     (li.ajax_block_product) met prijs incl. btw in .price, de oude prijs in .old_price_home en
//     voorraad als icoon (avail-1 = op voorraad, avail-3 = uitverkocht).
//   - De Engelse URL's (/shop/en/); de XML-sitemap bevat alles dubbel (Engels en Spaans).
//     Productpagina's bezoeken we niet: de listings bevatten alle data.
type Area51 struct {
	mu    sync.RWMutex
	paths map[string]string // categorie-URL → pad in de boom
}

func (*Area51) Slug() string    { return "area51" }
func (*Area51) Name() string    { return "Area51 RC" }
func (*Area51) BaseURL() string { return "https://www.area51-rc.es" }
func (*Area51) Description() string {
	return "Spaanse helikopterspecialist met Align, SAB en BeastX, plus vliegtuigen, auto's, drones, accu's en Optifuel."
}

const area51Shop = "https://www.area51-rc.es/shop/en/"

var area51SkipTopRe = regexp.MustCompile(`(?i)^(new products|specials|merchandising|flying lessons|gift vouchers|slot)$`)

func (s *Area51) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	doc, _, err := fetchDoc(ctx, f, area51Shop)
	if err != nil {
		return nil, nil, err
	}
	paths := map[string]string{}
	var listings []string
	var walk func(ul *goquery.Selection, parent []string)
	walk = func(ul *goquery.Selection, parent []string) {
		ul.ChildrenFiltered("li").Each(func(_ int, li *goquery.Selection) {
			a := li.ChildrenFiltered("a").First()
			name := parse.Clean(a.Text())
			href := area51CategoryURL(attr(a, "href"))
			if name == "" || href == "" || (len(parent) == 0 && area51SkipTopRe.MatchString(name)) {
				return
			}
			// "RC Heli Kits & Parts" zou door "Parts" elke heli als onderdeel laten indelen;
			// onderdelen herkennen we aan de subcategorie ("Parts", "Repuestos").
			label := name
			if len(parent) == 0 && strings.HasPrefix(name, "RC Heli") {
				label = "Helicopters"
			}
			path := append(append([]string{}, parent...), label)
			if _, seen := paths[href]; !seen {
				paths[href] = strings.Join(path, " | ")
				listings = append(listings, href+"?n=50")
			}
			walk(li.ChildrenFiltered("ul"), path)
		})
	}
	walk(doc.Find("#categories_block_left ul.tree").First(), nil)

	s.mu.Lock()
	s.paths = paths
	s.mu.Unlock()
	return listings, nil, nil
}

// area51CategoryURL normaliseert een categorielink naar https zonder query.
func area51CategoryURL(href string) string {
	href = stripQuery(strings.TrimSpace(href))
	href = strings.Replace(href, "http://", "https://", 1)
	if !strings.HasPrefix(href, area51Shop) {
		return ""
	}
	return href
}

var (
	area51IDRe  = regexp.MustCompile(`/(\d+)-[^/]*\.html$`)
	area51SKURe = regexp.MustCompile(`Art\.Nr:\s*(\S+)`)
)

func (s *Area51) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	s.mu.RLock()
	hint := s.paths[area51CategoryURL(pageURL)]
	s.mu.RUnlock()
	if hint == "" {
		hint = parse.Clean(doc.Find("h1").First().Text())
	}
	var out []parse.Product
	doc.Find("li.ajax_block_product").Each(func(_ int, card *goquery.Selection) {
		link := card.Find("a.nombreProd").First()
		href := stripQuery(attr(link, "href"))
		m := area51IDRe.FindStringSubmatch(href)
		if m == nil {
			return
		}
		price := card.Find(".content_price").First()
		avail := attr(card.Find(`img[src*="avail-"]`).First(), "src")
		p := parse.Product{
			ExternalID: m[1],
			URL:        strings.Replace(href, "http://", "https://", 1),
			Name:       parse.Clean(link.Text()),
			// "-home" is een thumbnail van 100px; "-large" is dezelfde foto groter.
			ImageURL:     strings.Replace(imgSrc(card.Find("a.product_img_link img").First()), "-home/", "-large/", 1),
			Price:        parse.Price(price.Find(".price").First().Text()),
			OldPrice:     parse.Price(price.Find(".old_price_home").First().Text()),
			InStock:      inStockFrom(strings.Contains(avail, "avail-1."), strings.Contains(avail, "avail-3.")),
			CategoryHint: hint,
		}
		if sku := area51SKURe.FindStringSubmatch(card.Find(".availability").First().Text()); sku != nil {
			p.SKU = sku[1]
		}
		if p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	next := attr(doc.Find("#pagination_next a").First(), "href")
	if len(out) == 0 {
		next = ""
	}
	return out, next
}

// ParseProduct wordt niet gebruikt: we bezoeken geen productpagina's (zie boven).
func (s *Area51) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
