package shops

import (
	"context"
	"time"

	"github.com/PuerkitoBio/goquery"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/fetch"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
	"github.com/heapreaper/modelbouwkortingen/crawler/internal/sitemap"
)

// ChinaHobbyLine draait op Shopify (zie shopify.go), met CNHL-accu's als hoofdmerk.
//
//   - De winkelvaluta is USD; via Shopify Markets geeft ?country=NL de europrijzen die een
//     Nederlandse bezoeker ziet (ook in /products.json). De europrijs is de dollarprijs maal
//     een wisselkoers van Shopify, dus koersschommelingen bewegen alle prijzen tegelijk.
//   - Listings: /nl/products.json?country=NL (Nederlandse titels, europrijzen).
//   - Productpagina's bezoeken we niet: zonder ?country=NL tonen ze dollars, en de feed bevat
//     alles al. compare_at_price is vaak gelijk aan de prijs; de store negeert dat.
type ChinaHobbyLine struct{}

const chinaHobbyLineNL = "https://chinahobbyline.com/nl"

func (*ChinaHobbyLine) Slug() string    { return "chinahobbyline" }
func (*ChinaHobbyLine) Name() string    { return "ChinaHobbyLine" }
func (*ChinaHobbyLine) BaseURL() string { return "https://chinahobbyline.com" }
func (*ChinaHobbyLine) Description() string {
	return "Webshop van accumerk CNHL met LiPo-, LiHV- en LiFe-accu's, laders en RC-modellen."
}

func (*ChinaHobbyLine) UserAgent() string { return shopifyUserAgent }

func (*ChinaHobbyLine) MinDelay() time.Duration { return time.Second }

func (s *ChinaHobbyLine) Discover(context.Context, *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	seeds := shopifyFeedSeeds(chinaHobbyLineNL)
	for i := range seeds {
		seeds[i] += "&country=NL"
	}
	return seeds, nil, nil
}

// ParseListingRaw leest een pagina van /products.json. De tags zijn specificaties ("120C", "4S")
// en marketinglabels als "all-airplane-battery", die een accu als vliegtuig zouden indelen;
// alleen product_type ("LiHV", "Lipo", ...) telt mee als categoriehint.
func (s *ChinaHobbyLine) ParseListingRaw(pageURL string, body []byte) ([]parse.Product, string) {
	return parseShopifyFeed(chinaHobbyLineNL, pageURL, body, func(string) bool { return false })
}

// ParseListing wordt niet gebruikt: de listings zijn JSON (zie ParseListingRaw).
func (s *ChinaHobbyLine) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

// ParseProduct wordt niet gebruikt: we bezoeken geen productpagina's (zie boven).
func (s *ChinaHobbyLine) ParseProduct(string, *goquery.Document) *parse.Product {
	return nil
}
