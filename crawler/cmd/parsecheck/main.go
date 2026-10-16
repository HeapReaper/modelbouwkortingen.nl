// parsecheck is een ontwikkeltool: parse een lokaal opgeslagen HTML-bestand met de
// parser van een shop en print het resultaat. Handig als een webshop zijn HTML wijzigt.
//
//	go run ./cmd/parsecheck -shop toemen -kind product -url https://www.toemen.nl/product/x pagina.html
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/categorize"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/shops"
)

func main() {
	shopSlug := flag.String("shop", "", "toprc | toemen | wetronic")
	kind := flag.String("kind", "product", "product | listing")
	pageURL := flag.String("url", "", "URL van de pagina")
	flag.Parse()
	list := shops.BySlug([]string{*shopSlug})
	if len(list) == 0 || flag.NArg() != 1 {
		fmt.Fprintln(os.Stderr, "gebruik: parsecheck -shop <slug> -kind product|listing -url <url> <bestand.html>")
		os.Exit(2)
	}
	f, err := os.Open(flag.Arg(0))
	if err != nil {
		panic(err)
	}
	doc, err := goquery.NewDocumentFromReader(f)
	if err != nil {
		panic(err)
	}
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	shop := list[0]
	if *kind == "listing" {
		products, next := shop.ParseListing(*pageURL, doc)
		for _, p := range products {
			fmt.Printf("%-8s %8.2f %8.2f  %-14s %s\n", p.ExternalID, p.Price, p.OldPrice,
				categorize.Classify(p.Breadcrumbs, p.CategoryHint, p.URL, p.Name), p.Name)
		}
		fmt.Printf("%d producten, volgende pagina: %q\n", len(products), next)
		return
	}
	p := shop.ParseProduct(*pageURL, doc)
	_ = enc.Encode(p)
	if p != nil {
		fmt.Println("categorie:", categorize.Classify(p.Breadcrumbs, p.CategoryHint, p.URL, p.Name))
	}
}
