// Package sitemap leest sitemap.xml bestanden (inclusief sitemap-indexen).
package sitemap

import (
	"bytes"
	"context"
	"encoding/xml"
	"errors"
	"strings"
	"time"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
)

type URL struct {
	Loc      string
	LastMod  time.Time
	HasImage bool // <image:image> aanwezig; bij sommige shops het kenmerk van een productpagina
}

type urlset struct {
	URLs []struct {
		Loc     string `xml:"loc"`
		LastMod string `xml:"lastmod"`
		Images  []struct {
			Loc string `xml:"loc"`
		} `xml:"image"`
	} `xml:"url"`
	Sitemaps []struct {
		Loc string `xml:"loc"`
	} `xml:"sitemap"`
}

// Fetch haalt een sitemap op en volgt geneste sitemap-indexen. Met `follow` kun je
// bepalen welke sub-sitemaps gevolgd worden (nil = allemaal).
func Fetch(ctx context.Context, f *fetch.Fetcher, sitemapURL string, follow func(string) bool) ([]URL, error) {
	var out []URL
	seen := map[string]bool{}
	var walk func(u string, depth int) error
	walk = func(u string, depth int) error {
		if seen[u] || depth > 3 {
			return nil
		}
		seen[u] = true
		doc, err := fetchDoc(ctx, f, u)
		if err != nil {
			return err
		}
		for _, s := range doc.Sitemaps {
			loc := strings.TrimSpace(s.Loc)
			if loc == "" || (follow != nil && !follow(loc)) {
				continue
			}
			if err := walk(loc, depth+1); err != nil && ctx.Err() == nil {
				// één kapotte sub-sitemap mag de rest niet tegenhouden
				continue
			}
		}
		for _, x := range doc.URLs {
			loc := strings.TrimSpace(x.Loc)
			if loc == "" {
				continue
			}
			out = append(out, URL{Loc: loc, LastMod: parseTime(x.LastMod), HasImage: len(x.Images) > 0})
		}
		return ctx.Err()
	}
	err := walk(sitemapURL, 0)
	return out, err
}

// retryWait is hoe lang we wachten voordat we een kapotte sitemap opnieuw ophalen.
var retryWait = 30 * time.Second

// fetchDoc haalt één sitemap op en leest hem in. Is de XML kapot, dan nog één poging na
// retryWait: sommige shops (Berlinski, ~45 MB) leveren af en toe een half bestand, vermoedelijk
// terwijl de sitemap opnieuw gegenereerd wordt.
func fetchDoc(ctx context.Context, f *fetch.Fetcher, u string) (urlset, error) {
	var doc urlset
	for attempt := 0; ; attempt++ {
		resp, err := f.Get(ctx, u)
		if err != nil {
			return doc, err
		}
		doc = urlset{}
		dec := xml.NewDecoder(bytes.NewReader(resp.Body))
		dec.Strict = false
		err = dec.Decode(&doc)
		var syntaxErr *xml.SyntaxError
		if err == nil || attempt > 0 || !errors.As(err, &syntaxErr) {
			return doc, err
		}
		select {
		case <-ctx.Done():
			return doc, ctx.Err()
		case <-time.After(retryWait):
		}
	}
}

func parseTime(s string) time.Time {
	s = strings.TrimSpace(s)
	for _, layout := range []string{time.RFC3339, "2006-01-02T15:04:05Z0700", "2006-01-02T15:04:05", "2006-01-02"} {
		if t, err := time.Parse(layout, s); err == nil {
			return t
		}
	}
	return time.Time{}
}
