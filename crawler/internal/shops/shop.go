// Package shops bevat per webshop de kennis over URL-structuur en HTML-opmaak.
package shops

import (
	"context"
	"encoding/json"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Shop beschrijft hoe één webshop gecrawld wordt.
type Shop interface {
	Slug() string
	Name() string
	BaseURL() string
	Description() string
	// Discover levert de te bezoeken listingpagina's (categorieën/aanbiedingen) en productpagina's.
	Discover(ctx context.Context, f *fetch.Fetcher) (listings []string, products []sitemap.URL, err error)
	// ParseListing haalt alle productkaarten uit een listingpagina en geeft eventueel de volgende pagina.
	ParseListing(pageURL string, doc *goquery.Document) (products []parse.Product, next string)
	// ParseProduct haalt de productdata uit een productpagina (nil = geen product op deze pagina).
	ParseProduct(pageURL string, doc *goquery.Document) *parse.Product
}

// RawListingParser is voor shops waarvan de listing-URL's geen HTML maar bv. JSON
// teruggeven (Shopify /products.json). De runner gebruikt dan deze methode i.p.v. ParseListing.
type RawListingParser interface {
	ParseListingRaw(pageURL string, body []byte) (products []parse.Product, next string)
}

// ProductPageLimiter beperkt het aantal productpagina's per ronde voor shops die
// (via Crawl-delay) heel langzaam gecrawld moeten worden; de prijzen komen dan uit de listings.
type ProductPageLimiter interface {
	MaxProductPages() int
}

// HostPolicy is voor shops die een eigen user-agent of een rustiger tempo nodig hebben.
type HostPolicy interface {
	UserAgent() string
	MinDelay() time.Duration
}

// PercentDeals is voor shops waarvan de europrijs met een wisselkoers meebeweegt: een paar
// procent koersverschil is bij een duur product al snel "€5 korting". Zo'n shop telt een
// prijsdaling alleen als deal vanaf dit percentage, ongeacht het bedrag.
type PercentDeals interface {
	MinDealPercent() float64
}

func All() []Shop {
	return []Shop{&TopRC{}, &Toemen{}, &Wetronic{}, &Hoellein{}, &Berlinski{}, &MiniZShop{}, &MGModellbau{}, &Hacker{}, &RCMotorsports{}, &Droneshop{}, &Tamico{}, &ChinaHobbyLine{}, &Hepf{}, &Bliek{}, &Aerobertics{}, &Heligear{}, &Area51{}, &Banggood{}, &Voltmaster{}, &NFactory{}, &Lindinger{}, &RCCarOnline{}, &PremiumModellbau{}, &CopterFarm{}, &Shopzinnig{}}
}

func BySlug(slugs []string) []Shop {
	if len(slugs) == 0 {
		return All()
	}
	want := map[string]bool{}
	for _, s := range slugs {
		want[s] = true
	}
	var out []Shop
	for _, s := range All() {
		if want[s.Slug()] {
			out = append(out, s)
		}
	}
	return out
}

var (
	saleLinkRe    = regexp.MustCompile(`(?i)(^|[/_-])(aanbieding(en)?|deals?|sale|acties?|kortingen?|outlet|uitverkoop|specials?)([/_.-]|$)`)
	accountPathRe = regexp.MustCompile(`(?i)(customer|account|order|checkout|cart|winkelwagen|wishlist|login)`)
)

// discoverSaleLinks zoekt op de homepage naar links naar aanbiedingenpagina's op dezelfde host.
func discoverSaleLinks(ctx context.Context, f *fetch.Fetcher, home string, skip func(string) bool) []string {
	resp, err := f.Get(ctx, home)
	if err != nil {
		return nil
	}
	doc, err := parse.Document(resp.Body, resp.Header.Get("Content-Type"))
	if err != nil {
		return nil
	}
	base, _ := url.Parse(resp.URL)
	seen := map[string]bool{}
	var out []string
	doc.Find("a[href]").Each(func(_ int, a *goquery.Selection) {
		href, _ := a.Attr("href")
		u, err := base.Parse(strings.TrimSpace(href))
		if err != nil || u.Host != base.Host {
			return
		}
		u.Fragment = ""
		link := u.String()
		if seen[link] || !saleLinkRe.MatchString(u.Path) || accountPathRe.MatchString(u.Path) || (skip != nil && skip(link)) {
			return
		}
		seen[link] = true
		out = append(out, link)
	})
	return out
}

func stripQuery(u string) string {
	if i := strings.IndexAny(u, "?#"); i >= 0 {
		return u[:i]
	}
	return u
}

func attr(s *goquery.Selection, name string) string {
	v, _ := s.Attr(name)
	return strings.TrimSpace(v)
}

// imgSrc pakt de echte afbeelding, ook als de shop lazy loading gebruikt.
func imgSrc(img *goquery.Selection) string {
	for _, a := range []string{"data-lazy-src", "data-original", "data-src", "src"} {
		if v := attr(img, a); v != "" && !strings.HasPrefix(v, "data:") {
			return v
		}
	}
	if v := attr(img, "srcset"); v != "" {
		return srcsetFirst(v)
	}
	return ""
}

// srcsetFirst geeft de eerste URL uit een srcset ("a.jpg, b.jpg 2x" → "a.jpg"). Zonder
// breedte- of dichtheidsaanduiding staat de komma direct achter de URL.
func srcsetFirst(srcset string) string {
	return strings.TrimRight(strings.Fields(srcset)[0], ",")
}

var gtmFieldRe = func(field string) *regexp.Regexp {
	return regexp.MustCompile(`"` + field + `":"((?:[^"\\]|\\.)*)"`)
}

// unescapeJSONString decodeert de inhoud van een JSON string-literal (zonder quotes).
func unescapeJSONString(s string) string {
	var out string
	if err := json.Unmarshal([]byte(`"`+s+`"`), &out); err != nil {
		return parse.Clean(s)
	}
	return parse.Clean(out)
}

// fetchDoc haalt een HTML-pagina op en parset hem (met tekenset-conversie).
func fetchDoc(ctx context.Context, f *fetch.Fetcher, u string) (*goquery.Document, string, error) {
	resp, err := f.Get(ctx, u)
	if err != nil {
		return nil, "", err
	}
	doc, err := parse.Document(resp.Body, resp.Header.Get("Content-Type"))
	return doc, resp.URL, err
}

// leafCategories houdt alleen de categorieën over die zelf geen subcategorieën hebben:
// bovenliggende categorieën tonen dezelfde producten nog een keer. minDepth is het
// minimale aantal padsegmenten (filtert losse pagina's als /versand).
func leafCategories(urls []string, minDepth int) []string {
	// "/auto-s.html" is de ouder van "/auto-s/traxxas.html" (Magento met URL-suffix).
	norm := func(u string) string { return strings.TrimSuffix(strings.TrimRight(stripQuery(u), "/"), ".html") }
	var out []string
	for _, u := range urls {
		n := norm(u)
		path := n
		if i := strings.Index(path, "://"); i >= 0 {
			path = path[i+3:]
		}
		if strings.Count(path, "/") < minDepth {
			continue
		}
		leaf := true
		for _, other := range urls {
			if strings.HasPrefix(norm(other), n+"/") {
				leaf = false
				break
			}
		}
		if leaf {
			out = append(out, u)
		}
	}
	return dedupe(out)
}

// inStockFrom geeft voorraadinformatie op basis van "groen/rood"-iconen (nil = onbekend).
func inStockFrom(green, red bool) *bool {
	switch {
	case green:
		t := true
		return &t
	case red:
		f := false
		return &f
	}
	return nil
}
