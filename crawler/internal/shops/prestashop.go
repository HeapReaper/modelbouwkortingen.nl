package shops

import (
	"context"
	"encoding/json"
	"html"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
)

// Gedeelde helpers voor shops op PrestaShop 1.7/8.
//
//   - Een categoriepagina met ?ajax=1 geeft JSON in plaats van HTML (dezelfde die de filters
//     op de site gebruiken), met per product id, naam, referentie, merk, standaardcategorie,
//     prijs (price_amount, incl. btw), normale prijs (regular_price_amount) en foto.
//   - De hoofdcategorie (id 2, "Accueil"/"Home") bevat alle producten, dus die ene categorie
//     is genoeg, 100 per pagina (resultsPerPage). robots.txt verbiedt bij deze shops alleen
//     ?n= en ?order=, niet ?page= of ?resultsPerPage=.
//   - Het aantal pagina's staat in pagination.pages_count; omdat de runner per startpagina
//     maximaal 50 pagina's volgt, starten we elke 50 pagina's een nieuwe reeks.
//   - Voorraad staat niet in de JSON (availability is altijd null), dus die blijft onbekend.

const psPageSize = 100

// psFeed is de JSON-listing van een categorie (zonder page). Zonder vriendelijke URL's is de
// categorie /index.php?id_category=2&controller=category.
func psFeed(categoryURL string) string {
	sep := "?"
	if strings.Contains(categoryURL, "?") {
		sep = "&"
	}
	return categoryURL + sep + "ajax=1&resultsPerPage=" + strconv.Itoa(psPageSize)
}

type psListing struct {
	Products []struct {
		ID                 json.Number `json:"id_product"`
		Name               string      `json:"name"`
		Reference          string      `json:"reference"`
		Manufacturer       string      `json:"manufacturer_name"`
		Category           string      `json:"category_name"`
		URL                string      `json:"url"`
		CanonicalURL       string      `json:"canonical_url"`
		PriceAmount        float64     `json:"price_amount"`
		RegularPriceAmount float64     `json:"regular_price_amount"`
		// Zonder foto is cover false in plaats van een object.
		Cover json.RawMessage `json:"cover"`
	} `json:"products"`
	Pagination struct {
		PagesCount  int `json:"pages_count"`
		CurrentPage int `json:"current_page"`
	} `json:"pagination"`
}

// psSeeds vraagt het aantal pagina's op en geeft een startpagina per 50 pagina's.
func psSeeds(ctx context.Context, f *fetch.Fetcher, feed string) ([]string, error) {
	resp, err := f.Get(ctx, feed+"&page=1")
	if err != nil {
		return nil, err
	}
	var l psListing
	if err := json.Unmarshal(resp.Body, &l); err != nil {
		return nil, err
	}
	seeds := []string{feed + "&page=1"}
	for p := 1 + maxPagesPerSeed; p <= l.Pagination.PagesCount; p += maxPagesPerSeed {
		seeds = append(seeds, feed+"&page="+strconv.Itoa(p))
	}
	return seeds, nil
}

// parsePSListing leest een pagina JSON-listing. skip (mag nil zijn) slaat producten over op
// basis van hun standaardcategorie.
func parsePSListing(pageURL string, body []byte, skip func(category string) bool) ([]parse.Product, string) {
	var l psListing
	if err := json.Unmarshal(body, &l); err != nil {
		return nil, ""
	}
	var out []parse.Product
	for _, it := range l.Products {
		category := parse.Clean(html.UnescapeString(it.Category))
		if skip != nil && skip(category) {
			continue
		}
		p := parse.Product{
			ExternalID: it.ID.String(),
			URL:        firstNonEmpty(it.CanonicalURL, it.URL),
			Name:       parse.Clean(html.UnescapeString(it.Name)),
			SKU:        it.Reference,
			Brand:      parse.Clean(it.Manufacturer),
			Price:      it.PriceAmount,
		}
		if category != "" {
			p.Breadcrumbs = []string{category}
		}
		if it.RegularPriceAmount > p.Price {
			p.OldPrice = it.RegularPriceAmount
		}
		var cover struct {
			Large struct {
				URL string `json:"url"`
			} `json:"large"`
		}
		if json.Unmarshal(it.Cover, &cover) == nil {
			p.ImageURL = cover.Large.URL
		}
		if p.Price > 0 && p.Name != "" && p.URL != "" {
			out = append(out, p)
		}
	}
	if len(l.Products) == 0 || l.Pagination.CurrentPage >= l.Pagination.PagesCount {
		return out, ""
	}
	u, err := url.Parse(pageURL)
	if err != nil {
		return out, ""
	}
	q := u.Query()
	q.Set("page", strconv.Itoa(l.Pagination.CurrentPage+1))
	u.RawQuery = q.Encode()
	return out, u.String()
}

var psBreadcrumbRe = regexp.MustCompile(`"breadcrumb":\{"links":(\[[^\]]*\])`)

// psBreadcrumbs leest het kruimelpad uit het inline prestashop-object van een pagina
// (prestashop.breadcrumb.links), zonder "Home" en zonder de pagina zelf.
func psBreadcrumbs(doc *goquery.Document) []string {
	var crumbs []string
	doc.Find("script").EachWithBreak(func(_ int, s *goquery.Selection) bool {
		m := psBreadcrumbRe.FindStringSubmatch(s.Text())
		if m == nil {
			return true
		}
		var links []struct {
			Title string `json:"title"`
		}
		if json.Unmarshal([]byte(m[1]), &links) == nil {
			for _, l := range links {
				crumbs = append(crumbs, parse.Clean(html.UnescapeString(l.Title)))
			}
		}
		return false
	})
	if len(crumbs) > 2 {
		return crumbs[1 : len(crumbs)-1]
	}
	return nil
}
