package shops

import (
	"context"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/fetch"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/sitemap"
)

// MGModellbau (mg-modellbau.de) draait op een eigen shopsysteem.
//
//   - Sitemap: /sitemap.xml → sitemap1..N.xml. Categorieën eindigen op "/", producten op ".html"
//     (losse pagina's als /Unsere-AGB.html staan direct onder de root). /Archiv/ slaan we over.
//   - Listings: onderste categorieën, paginering via ?apg=N. Kaarten zijn schema.org Products
//     (.thumb_artikel) met itemprop="price" en "Artikelnummer: ...".
//   - Productpagina's: microdata (itemprop price/availability); het artikelnummer staat in input[name=artnr].
type MGModellbau struct{}

func (*MGModellbau) Slug() string    { return "mgmodellbau" }
func (*MGModellbau) Name() string    { return "MG-Modellbau" }
func (*MGModellbau) BaseURL() string { return "https://www.mg-modellbau.de" }
func (*MGModellbau) Description() string {
	return "Duitse modelbouwshop met veel zenders, ontvangers, elektronica en onderdelen."
}

func (s *MGModellbau) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap.xml", nil)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var products []sitemap.URL
	var categories []string
	for _, u := range urls {
		path := strings.TrimPrefix(u.Loc, s.BaseURL())
		switch {
		case strings.HasPrefix(path, "/Archiv/") || strings.Contains(path, "?"):
		case strings.HasSuffix(path, ".html") && strings.Count(path, "/") >= 2:
			products = append(products, u)
		case strings.HasSuffix(path, "/") && path != "/":
			categories = append(categories, u.Loc)
		}
	}
	return leafCategories(categories, 1), products, nil
}

var mgArtNrRe = regexp.MustCompile(`Artikelnummer:\s*(\S+)`)

func mgStock(sel *goquery.Selection) *bool {
	html, _ := sel.Html()
	return inStockFrom(strings.Contains(html, "ball_green"), strings.Contains(html, "ball_red"))
}

func (s *MGModellbau) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	var out []parse.Product
	hint := strings.Join(mgCrumbs(doc), " | ")
	doc.Find(`.thumb_artikel[itemtype$="schema.org/Product"]`).Each(func(_ int, card *goquery.Selection) {
		link := card.Find(`a[itemprop="url"]`).First()
		p := parse.Product{
			URL:          stripQuery(attr(link, "href")),
			Name:         parse.Clean(card.Find(`[itemprop="name"]`).First().Text()),
			ImageURL:     attr(card.Find(`img[itemprop="image"]`).First(), "src"),
			Price:        parse.Price(attr(card.Find(`[itemprop="price"]`).First(), "content")),
			InStock:      mgStock(card.Find(".vk").First()),
			CategoryHint: hint,
		}
		if m := mgArtNrRe.FindStringSubmatch(card.Text()); m != nil {
			p.ExternalID = m[1]
		}
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	next := ""
	if a := doc.Find("ul.pagination li.active").First().Next().Find("a").First(); a.Length() > 0 {
		// Op de laatste pagina staat na de actieve pagina alleen nog de "»"-link.
		if t := parse.Clean(a.Text()); t != "»" && t != "" {
			next = parse.AbsURL(s.BaseURL(), attr(a, "href"))
		}
	}
	return out, next
}

// mgCrumbs leest de microdata-breadcrumbs zonder "Startseite"/"Shop".
func mgCrumbs(doc *goquery.Document) []string {
	var out []string
	for _, c := range parse.MicrodataCrumbs(doc) {
		if c != "Startseite" && c != "Shop" {
			out = append(out, c)
		}
	}
	return out
}

func (s *MGModellbau) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	main := doc.Find(`[itemtype$="schema.org/Product"]`).First()
	id := attr(main.Find(`input[name="artnr"]`).First(), "value")
	if main.Length() == 0 || id == "" {
		return nil
	}
	name, _ := main.Find(`meta[itemprop="name"]`).Attr("content")
	image, _ := main.Find(`meta[itemprop="image"]`).Attr("content")
	offer := main.Find(`[itemprop="offers"]`).First()
	p := &parse.Product{
		ExternalID:  id,
		URL:         firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:        firstNonEmpty(parse.Clean(name), parse.Clean(main.Find("h1").First().Text())),
		SKU:         id,
		ImageURL:    image,
		Price:       parse.Price(attr(offer.Find(`[itemprop="price"]`).First(), "content")),
		InStock:     parse.Availability(attr(offer.Find(`[itemprop="availability"]`).First(), "href")),
		Breadcrumbs: mgCrumbs(doc),
	}
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
