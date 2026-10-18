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

// Bliek Modelbouw (Breda) draait op Magento 2 (Porto-thema, Amasty) met ".html"-URL's.
//
//   - Sitemap: /sitemap/bliek_modelbouw/bliek_modelbouw.xml → -8-1..3.xml (~31.000 URL's).
//     Producten hebben een <image:image>, categorieën niet.
//   - Alleen de RC-, verf/gereedschap- en uitloper-categorieën: plastic bouwdozen, modeltreinen,
//     puzzels en boeken passen niet bij de site. Bovenliggende categorieën zijn tegeloverzichten
//     zonder producten, dus we nemen de onderste categorieën.
//   - Listings: 32 per pagina met ?product_list_limit=32 (de volgende-link houdt die vast), kaarten
//     zoals bij Droneshop (zie magento.go). Er zijn geen breadcrumbs; het categoriepad in de URL
//     ("rc-auto-s/traxxas", "rc-onderdelen/electronica/laders") is de categoriehint.
//   - Productpagina's bezoeken we niet: de listings bevatten alle data.
type Bliek struct{}

func (*Bliek) Slug() string    { return "bliek" }
func (*Bliek) Name() string    { return "Bliek Modelbouw" }
func (*Bliek) BaseURL() string { return "https://webshop.bliekmodelbouw.nl" }
func (*Bliek) Description() string {
	return "Modelbouwwinkel in Breda met RC-auto's, trucks, vliegtuigen, helikopters en boten, plus onderdelen en verf."
}

var bliekSections = []string{"/radio-control/", "/verf-gereedschap/", "/uitlopers/"}

func (s *Bliek) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/sitemap/bliek_modelbouw/bliek_modelbouw.xml", nil)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	var categories []string
	for _, u := range urls {
		path := strings.TrimPrefix(u.Loc, s.BaseURL())
		if u.HasImage || strings.Contains(path, "?") {
			continue
		}
		for _, prefix := range bliekSections {
			if strings.HasPrefix(path, prefix) {
				categories = append(categories, u.Loc)
				break
			}
		}
	}
	leaves := leafCategories(categories, 2)
	for i := range leaves {
		leaves[i] += "?product_list_limit=32"
	}
	return leaves, nil, nil
}

// bliekHint maakt van het categoriepad een leesbare hint, zonder de SEO-woorden
// ("bliek-modelbouw-breda-rc-vliegtuigen" → "rc vliegtuigen").
func bliekHint(pageURL string) string {
	u, err := url.Parse(pageURL)
	if err != nil {
		return ""
	}
	seo := strings.NewReplacer("bliek-modelbouw-", "", "-bliek-modelbouw", "", "breda-", "", "-breda", "")
	var parts []string
	for _, seg := range strings.Split(strings.TrimSuffix(strings.Trim(u.Path, "/"), ".html"), "/") {
		if seg = strings.ReplaceAll(seo.Replace(seg), "-", " "); seg != "" && seg != "radio control" {
			parts = append(parts, seg)
		}
	}
	return strings.Join(parts, " | ")
}

func (s *Bliek) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	return magentoListing(doc, bliekHint(pageURL))
}

// ParseProduct wordt niet gebruikt: we bezoeken geen productpagina's (zie boven).
func (s *Bliek) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
