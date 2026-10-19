package shops

import (
	"context"
	"net/url"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Shopzinnig draait op LogiVert (Smarty-templates, alles via index.php?action=...).
//
//   - robots.txt vraagt Crawl-delay: 30. Productpagina's bezoeken we daarom niet: de listings
//     bevatten alle data (naam, artikelnummer, prijs, van-prijs, voorraad, afbeelding).
//   - Sitemap: /sitemap.xml met ~290 groepen (action=page&group_id=N) en ~2.000 artikelen
//     (action=article&aid=N). De groepen zijn plat, dus of een groep subgroepen heeft is niet te
//     zien; bovenliggende groepen tonen alleen subgroepen en leveren dan niets op.
//   - Listings: 28 kaarten (div.art3compdisplay, id="product_<aid>") per pagina; volgende
//     pagina via a.listforward (&page=N). De van-prijs staat doorgestreept in
//     .articlePricerecommended, de voorraad als tekst ("Op voorraad." / "Niet op voorraad.").
type Shopzinnig struct{}

func (*Shopzinnig) Slug() string    { return "shopzinnig" }
func (*Shopzinnig) Name() string    { return "Shopzinnig" }
func (*Shopzinnig) BaseURL() string { return "https://www.shopzinnig.nl" }
func (*Shopzinnig) Description() string {
	return "Nederlandse modelbouwwinkel met veel onderdelen voor Blade-, E-sky- en Nine Eagles-heli's, plus drones, auto's, vliegtuigen en elektronica."
}

func (s *Shopzinnig) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap.xml", nil)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var listings []string
	for _, u := range urls {
		if strings.Contains(u.Loc, "action=page") && strings.Contains(u.Loc, "group_id=") {
			listings = append(listings, u.Loc)
		}
	}
	return dedupe(listings), nil, nil
}

func (s *Shopzinnig) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	crumbs := parse.MicrodataCrumbs(doc)
	if len(crumbs) > 0 {
		crumbs = crumbs[1:] // "Home"
	}
	var out []parse.Product
	doc.Find(`div.art3compdisplay[id^="product_"]`).Each(func(_ int, card *goquery.Selection) {
		link := card.Find(".desc a").First()
		p := parse.Product{
			ExternalID:   strings.TrimPrefix(attr(card, "id"), "product_"),
			URL:          s.articleURL(attr(link, "href")),
			Name:         parse.Clean(link.Text()),
			SKU:          parse.Clean(card.ChildrenFiltered(".desc").ChildrenFiltered("p").First().Text()),
			ImageURL:     imgSrc(card.Find("a.article img").First()),
			Price:        parse.Price(card.Find(".articlePrice .price").First().Text()),
			OldPrice:     parse.Price(card.Find(".articlePricerecommended").First().Text()),
			InStock:      shopzinnigStock(card.Find(".stock").First().Text()),
			CategoryHint: strings.Join(crumbs, " | "),
		}
		if p.OldPrice <= p.Price {
			p.OldPrice = 0
		}
		if p.ExternalID != "" && p.URL != "" && p.Name != "" && p.Price > 0 {
			out = append(out, p)
		}
	})
	if len(out) == 0 {
		return out, ""
	}
	return out, parse.AbsURL(s.BaseURL(), attr(doc.Find("a.listforward").First(), "href"))
}

// articleURL maakt van een artikellink de canonieke URL: zonder group_id (hetzelfde artikel
// staat in meerdere groepen) en in de volgorde van de sitemap.
func (s *Shopzinnig) articleURL(href string) string {
	u, err := url.Parse(href)
	if err != nil {
		return ""
	}
	q := u.Query()
	if q.Get("aid") == "" {
		return ""
	}
	return s.BaseURL() + "/index.php?item=" + url.QueryEscape(q.Get("item")) + "&action=article&aid=" + q.Get("aid") + "&lang=nl"
}

func shopzinnigStock(text string) *bool {
	t := strings.ToLower(parse.Clean(text))
	return inStockFrom(strings.HasPrefix(t, "op voorraad"), strings.HasPrefix(t, "niet op voorraad"))
}

// ParseProduct is alleen voor parsecheck: de crawler haalt alles uit de listings.
func (s *Shopzinnig) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	u := s.articleURL(firstNonEmpty(parse.Canonical(doc), pageURL))
	if u == "" {
		return nil
	}
	aid, _ := url.Parse(u)
	crumbs := parse.MicrodataCrumbs(doc)
	if len(crumbs) > 0 {
		crumbs = crumbs[1:] // "Home"
	}
	offer := doc.Find(".pricecontainer").First()
	p := &parse.Product{
		ExternalID:  aid.Query().Get("aid"),
		URL:         u,
		Name:        parse.Clean(doc.Find(`.productinfo [itemprop="name"]`).First().Text()),
		ImageURL:    parse.MetaContent(doc, "og:image"),
		Price:       parse.Price(offer.Find(`[itemprop="price"]`).First().Text()),
		OldPrice:    parse.Price(offer.Find(".articlePricerecommended").First().Text()),
		InStock:     shopzinnigStock(strings.TrimPrefix(attr(doc.Find(`[itemprop="availability"]`).First(), "content"), "Voorraad ")),
		Breadcrumbs: crumbs,
	}
	if p.OldPrice <= p.Price {
		p.OldPrice = 0
	}
	if p.Name == "" || p.Price == 0 {
		return nil
	}
	return p
}
