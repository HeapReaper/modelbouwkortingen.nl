// Package shops bevat per webshop de kennis over URL-structuur en HTML-opmaak.
package shops

import (
	"context"
	"encoding/json"
	"net/url"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/fetch"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/sitemap"
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

func All() []Shop {
	return []Shop{&TopRC{}, &Toemen{}, &Wetronic{}}
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
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(resp.Body)))
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
	for _, a := range []string{"data-lazy-src", "data-src", "src"} {
		if v := attr(img, a); v != "" && !strings.HasPrefix(v, "data:") {
			return v
		}
	}
	if v := attr(img, "srcset"); v != "" {
		return strings.Fields(v)[0]
	}
	return ""
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
