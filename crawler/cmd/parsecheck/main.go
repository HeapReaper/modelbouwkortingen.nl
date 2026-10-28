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

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/categorize"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/shops"
)

func main() {
	shopSlug := flag.String("shop", "", "toprc | toemen | wetronic | hoellein | berlinski | minizshop | mgmodellbau | hacker | rcmotorsports | droneshop | tamico | chinahobbyline | hepf | bliek | aerobertics | heligear | area51 | banggood | voltmaster | nfactory | lindinger | rccaronline | premiummodellbau | copterfarm | shopzinnig | hobbyking | speelgoedenmodelbouw | theborder | trxxs | erc | rcnmore | rcteam | mrcmodelisme | dronefpvracer | flashrc | originhobbies | stormrc | speedlimitrc | rcypadel | ttmodelismo | scalercbuzz | smartmodelismo | rcstorealgarve | myrcpitstop | radiocontrolledshop | helygo | todohobby | rcpro | tormodel | hobby351 | quartel | monsterhopups | ghw | rcfox | ruddog | shamrock | bauer | rcraceshop | dedition | rckleinkram | jonathan | tfl | dmt | rceurope | turbohobby | xtremrc | derkum")
	kind := flag.String("kind", "product", "product | listing")
	pageURL := flag.String("url", "", "URL van de pagina")
	flag.Parse()
	list := shops.BySlug([]string{*shopSlug})
	if len(list) == 0 || flag.NArg() != 1 {
		fmt.Fprintln(os.Stderr, "gebruik: parsecheck -shop <slug> -kind product|listing -url <url> <bestand.html>")
		os.Exit(2)
	}
	body, err := os.ReadFile(flag.Arg(0))
	if err != nil {
		panic(err)
	}
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	shop := list[0]
	raw, isRaw := shop.(shops.RawListingParser)
	var doc *goquery.Document
	// JSON-listings zijn geen HTML (en diep genest JSON laat de HTML-parser struikelen).
	if *kind != "listing" || !isRaw {
		if doc, err = parse.Document(body, ""); err != nil {
			panic(err)
		}
	}
	if *kind == "listing" {
		var products []parse.Product
		var next string
		if isRaw {
			products, next = raw.ParseListingRaw(*pageURL, body)
		} else {
			products, next = shop.ParseListing(*pageURL, doc)
		}
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
