package shops

import (
	"context"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// XtremRC (Frankrijk) draait op een eigen platform.
//
//   - Categorieën uit googlesitemap.php?language=fr: URL's op -xsl-<pad>.html, waarbij het pad de categorie-id's
//     zijn (bv. 428_606). We nemen de onderste categorieën; overgeslagen: de merkenbomen (438
//     "Nos marques" en 617 Traxxas, dubbel), soldes, bestsellers, Tamiya, Gunpla en maquettes.
//   - Listings: de producten staan als JSON-LD Product (met prijs, voorraad en merk) op de
//     categoriepagina, net als een BreadcrumbList. Met ?big_result=true zijn het er 100 per
//     pagina, paginering via &page=N.
//   - robots.txt vraagt een Crawl-delay van 5 s (de fetcher houdt zich daaraan).
type XtremRC struct{}

func (*XtremRC) Slug() string    { return "xtremrc" }
func (*XtremRC) Name() string    { return "XtremRC" }
func (*XtremRC) BaseURL() string { return "https://www.xtremrc.com" }
func (*XtremRC) Description() string {
	return "RC-winkel uit Landivisiau (Bretagne) met vooral auto's en onderdelen (Traxxas, Team Associated, Xray, Hobbytech), plus banden, elektronica, accu's en onderhoud."
}

var (
	xtremrcCategoryRe = regexp.MustCompile(`-xsl-([0-9_]+)\.html$`)
	xtremrcSkipTopRe  = regexp.MustCompile(`^(438|617|759|761|571|691|452)(_|$)`)
)

func (s *XtremRC) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	// De eerste sitemap uit de index bevat alle categorieën; de rest (één per categorie) zijn
	// ~250 extra requests met 5 s ertussen.
	urls, err := sitemap.Fetch(ctx, f, s.BaseURL()+"/googlesitemap.php?language=fr", nil)
	if err != nil && len(urls) == 0 {
		return nil, nil, err
	}
	byPath := map[string]string{}
	for _, u := range urls {
		if m := xtremrcCategoryRe.FindStringSubmatch(u.Loc); m != nil && !xtremrcSkipTopRe.MatchString(m[1]) {
			byPath[m[1]] = stripQuery(u.Loc)
		}
	}
	var listings []string
	for path, loc := range byPath {
		leaf := true
		for other := range byPath {
			if strings.HasPrefix(other, path+"_") {
				leaf = false
				break
			}
		}
		if leaf {
			listings = append(listings, loc+"?big_result=true")
		}
	}
	return listings, nil, nil
}

func (s *XtremRC) ParseListing(pageURL string, doc *goquery.Document) ([]parse.Product, string) {
	products := ldParseListing(doc)
	if len(products) == 0 {
		return products, ""
	}
	u, err := url.Parse(pageURL)
	if err != nil {
		return products, ""
	}
	page, _ := strconv.Atoi(u.Query().Get("page"))
	next := strconv.Itoa(max(page, 1) + 1)
	base := stripQuery(pageURL)
	found := false
	doc.Find(`a[href*="page=` + next + `"]`).EachWithBreak(func(_ int, a *goquery.Selection) bool {
		found = stripQuery(attr(a, "href")) == base
		return !found
	})
	if !found {
		return products, ""
	}
	return products, base + "?big_result=true&page=" + next
}

// ParseProduct wordt niet gebruikt: Discover levert geen productpagina's.
func (s *XtremRC) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
