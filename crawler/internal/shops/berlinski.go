package shops

import (
	"context"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Berlinski (modellbau-berlinski.de) draait op een eigen shopsysteem.
//
//   - Sitemap (uit robots.txt): /sitemap2.xml, één bestand van ~45 MB met alles. Productpagina's
//     zijn de URL's met een <image:image>; de rest zijn categorieën en losse pagina's.
//   - Listings: alleen de onderste categorieën (bovenliggende tonen dezelfde producten),
//     12 per pagina met paginering als /categorie/2/. Kaarten: .artbox#P<id>.
//   - Productpagina's: schema.org microdata (geen JSON-LD); het interne id staat in menge_<id>.
//   - Prijzen zijn inclusief de btw van het land van de bezoeker (NL: 21%).
type Berlinski struct{}

func (*Berlinski) Slug() string    { return "berlinski" }
func (*Berlinski) Name() string    { return "Modellbau Berlinski" }
func (*Berlinski) BaseURL() string { return "https://www.modellbau-berlinski.de" }
func (*Berlinski) Description() string {
	return "Grote Duitse modelbouwwinkel met RC-auto's, trucks, boten, vliegtuigen en veel onderdelen."
}

func (s *Berlinski) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap2.xml", nil)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var products []sitemap.URL
	var categories []string
	for _, u := range urls {
		switch {
		case strings.Contains(u.Loc, "?"):
		case u.HasImage:
			products = append(products, u)
		case !strings.Contains(u.Loc, "/katalog/") && !strings.Contains(u.Loc, "/pages/"):
			categories = append(categories, u.Loc)
		}
	}
	// minDepth 2: "/rc-antriebe/combos" wel, "/versand" niet (topcategorieën hebben altijd subcategorieën)
	return leafCategories(categories, 2), products, nil
}

func berlinskiStock(sel *goquery.Selection) *bool {
	html, _ := sel.Html()
	return inStockFrom(strings.Contains(html, "smilie-gruen"), strings.Contains(html, "smilie-rot"))
}

func (s *Berlinski) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	var out []parse.Product
	specific, all := berlinskiCrumbs(doc)
	if len(specific) == 0 {
		specific = all
	}
	hint := strings.Join(specific, " | ")
	if hint == "" {
		hint = parse.Clean(doc.Find("h1").First().Text())
	}
	doc.Find(`.artbox[id^="P"]`).Each(func(_ int, card *goquery.Selection) {
		link := card.Find(".title a").First()
		p := parse.Product{
			ExternalID:   strings.TrimPrefix(attr(card, "id"), "P"),
			URL:          stripQuery(attr(link, "href")),
			Name:         parse.Clean(link.Text()),
			Brand:        parse.Clean(card.Find(".manufacturer span").First().Text()),
			ImageURL:     imgSrc(card.Find(".image img").First()),
			Price:        parse.Price(card.Find(".product-price").First().Text()),
			InStock:      berlinskiStock(card.Find(".stock-info").First()),
			CategoryHint: hint,
		}
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	next := ""
	if a := doc.Find(".pagination li.next:not(.disabled) a").First(); a.Length() > 0 {
		next = parse.AbsURL(s.BaseURL(), attr(a, "href"))
	}
	return out, next
}

// berlinskiCrumbs geeft de breadcrumbs onder de hoofdcategorie (specific) en het hele pad (all).
// Hoofdcategorieën als "RC Elektronik und Akkus" zijn te breed om op in te delen.
func berlinskiCrumbs(doc *goquery.Document) (specific, all []string) {
	doc.Find(".breadcrumb-item").Each(func(_ int, li *goquery.Selection) {
		if t := parse.Clean(li.Text()); t != "" && t != "Modellbau Produkte" && !strings.EqualFold(t, "zurück") {
			all = append(all, t)
		}
	})
	if len(all) > 1 {
		specific = all[1:]
	}
	return specific, all
}

func (s *Berlinski) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	main := doc.Find(`[itemtype$="schema.org/Product"]`).First()
	if main.Length() == 0 {
		return nil
	}
	id := strings.TrimPrefix(attr(main.Find(`input[id^="menge_"]`).First(), "id"), "menge_")
	if id == "" {
		return nil
	}
	offer := main.Find(`[itemprop="offers"]`).First()
	brand, _ := main.Find(`meta[itemprop="brand"]`).Attr("content")
	p := &parse.Product{
		ExternalID: id,
		URL:        firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL)),
		Name:       parse.Clean(main.Find(`[itemprop="name"]`).First().Text()),
		SKU:        parse.Clean(main.Find(`[itemprop="sku"]`).First().Text()),
		Brand:      parse.Clean(brand),
		ImageURL:   parse.AbsURL(s.BaseURL(), attr(main.Find(`[itemprop="image"]`).First(), "href")),
		Price:      parse.Price(offer.Find(`[itemprop="price"]`).First().Text()),
		InStock:    parse.Availability(attr(offer.Find(`[itemprop="availability"]`).First(), "content")),
	}
	specific, all := berlinskiCrumbs(doc)
	p.Breadcrumbs = specific
	p.CategoryHint = strings.Join(all, " | ")
	if p.Price == 0 || p.Name == "" {
		return nil
	}
	return p
}
