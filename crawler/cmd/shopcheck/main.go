// shopcheck (lokaal hulpmiddel, niet committen): Discover + een paar listing-/productpagina's.
package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"sort"
	"time"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/categorize"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/config"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/shops"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/stats"
)

func main() {
	slug := flag.String("shop", "", "")
	seeds := flag.Int("seeds", 2, "aantal listings")
	pages := flag.Int("pages", 2, "pagina's per listing")
	prods := flag.Int("products", 3, "productpagina's")
	show := flag.Int("show", 8, "producten tonen")
	from := flag.Int("from", 0, "eerste listing")
	step := flag.Int("step", 1, "elke n-de listing")
	check := flag.Bool("robots", false, "controleer alleen of de URL's (argumenten) mogen")
	flag.Parse()
	if *check {
		log := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
		f := fetch.New(fetch.Options{UserAgent: config.DefaultUserAgent, HostDelay: 100 * time.Millisecond, Timeout: 30 * time.Second}, stats.New(), log)
		for _, u := range flag.Args() {
			fmt.Println(f.Allowed(context.Background(), u), u)
		}
		return
	}
	list := shops.BySlug([]string{*slug})
	if len(list) == 0 {
		fmt.Println("onbekend")
		os.Exit(2)
	}
	shop := list[0]
	log := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	f := fetch.New(fetch.Options{UserAgent: config.DefaultUserAgent, HostDelay: 500 * time.Millisecond, Timeout: 60 * time.Second, MaxRetries: 2, Backoff429: 5 * time.Second, MaxBackoff: 30 * time.Second}, stats.New(), log)
	pu, _ := url.Parse(shop.BaseURL())
	host := pu.Host
	if hp, ok := shop.(shops.HostPolicy); ok {
		f.SetHostPolicy(host, hp.UserAgent(), hp.MinDelay())
	}
	if _, ok := shop.(shops.HostTLS12); ok {
		f.SetHostTLS12(host)
	}
	if hc, ok := shop.(shops.HostCookies); ok {
		f.SetHostCookie(host, hc.Cookie())
	}
	ctx := context.Background()
	t0 := time.Now()
	listings, products, err := shop.Discover(ctx, f)
	fmt.Printf("discover: %d listings, %d productpagina's, err=%v (%s)\n", len(listings), len(products), err, time.Since(t0).Round(time.Millisecond))
	for i, l := range listings {
		if i < 5 {
			fmt.Println("  L", l)
		}
	}
	cats := map[string]int{}
	n, shown := 0, 0
	var oldN, stockN int
	pr := func(p parse.Product) {
		c := categorize.Classify(p.Breadcrumbs, p.CategoryHint, p.URL, p.Name)
		cats[c]++
		n++
		if p.OldPrice > 0 {
			oldN++
		}
		if p.InStock != nil {
			stockN++
		}
		if shown < *show {
			shown++
			st := "?"
			if p.InStock != nil {
				st = fmt.Sprint(*p.InStock)
			}
			fmt.Printf("  %-10s %8.2f %8.2f %-5s %-13s %s | %s | img=%v\n", p.ExternalID, p.Price, p.OldPrice, st, c, p.Name, p.URL, p.ImageURL != "")
		}
	}
	for n, i := 0, *from; n < *seeds && i < len(listings); n, i = n+1, i+*step {
		u := listings[i]
		for pg := 0; pg < *pages && u != ""; pg++ {
			var ps []parse.Product
			var next string
			resp, err := f.Get(ctx, u)
			if err != nil {
				fmt.Println("  fout", u, err)
				break
			}
			if raw, ok := shop.(shops.RawListingParser); ok {
				ps, next = raw.ParseListingRaw(resp.URL, resp.Body)
			} else {
				doc, err := parse.Document(resp.Body, resp.Header.Get("Content-Type"))
				if err != nil {
					break
				}
				ps, next = shop.ParseListing(resp.URL, doc)
			}
			fmt.Printf(" listing %s: %d producten, next=%q\n", u, len(ps), next)
			for _, p := range ps {
				p.URL = parse.AbsURL(shop.BaseURL(), p.URL)
				pr(p)
			}
			u = next
		}
	}
	for i := 0; i < *prods && i < len(products); i++ {
		u := products[len(products)*i / *prods].Loc
		resp, err := f.Get(ctx, u)
		if err != nil {
			fmt.Println("  fout", u, err)
			continue
		}
		doc, _ := parse.Document(resp.Body, resp.Header.Get("Content-Type"))
		p := shop.ParseProduct(resp.URL, doc)
		if p == nil {
			fmt.Println("  product nil:", u)
			continue
		}
		fmt.Printf(" product %s: crumbs=%v\n", u, p.Breadcrumbs)
		shown = 0
		pr(*p)
	}
	type kv struct {
		k string
		v int
	}
	var kvs []kv
	for k, v := range cats {
		kvs = append(kvs, kv{k, v})
	}
	sort.Slice(kvs, func(i, j int) bool { return kvs[i].v > kvs[j].v })
	fmt.Printf("totaal %d producten, %d met van-prijs, %d met voorraad; categorieën %v\n", n, oldN, stockN, kvs)
}
