package shops

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/sitemap"
)

// Banggood is een grote Chinese webwinkel; Nederlandse bezoekers komen op nl.banggood.com
// (Nederlandse namen, europrijzen). We nemen alleen complete RC-modellen: auto's (met
// werkvoertuigen), helikopters, boten, drones en vliegtuigen.
//
//   - Prijzen staan niet in de HTML: de site haalt ze met JavaScript op via /index.php, en
//     robots.txt verbiedt /*.php*. Elke productpagina heeft wel een tikTokPixel-object met
//     product-ID, categorie-ID, naam en de dollarprijs. De site rekent die om met
//     /cache/static_cache_read/currency_huilv.js: dollarprijs × EUR-koers × EurLoss, op centen
//     afgerond (85,99 × 0,8932 × 1,00338 = 77,07 €, precies wat een Nederlandse bezoeker ziet).
//   - Omdat de europrijs met de koers meebeweegt, telt een prijsdaling pas vanaf
//     MinDealPercent als deal. Een "van"-prijs staat nergens in de HTML.
//   - Discovery: van een categoriepagina mag alleen pagina 1 (de paginering valt onder
//     Disallow: /Wholesale-*-c-*-0-1-*.html), dus de populairste 60 per categorie. Daarnaast de
//     productsitemaps van "Toys Hobbies and Robot" (~30.000 URL's, ruwe .xml.gz) met een
//     voorselectie op de Engelse URL: RC-modellen wel, onderdelen, zenders en accu's niet.
//   - Productpagina's: de categorie-ID uit de pixel beslist. Andere categorieën (onderdelen,
//     speelgoed) geven geen product; de runner zet ze dan een week in crawl_misses.
//   - Werkvoertuigen (graafmachines, shovels, kiepwagens) staan bij Banggood onder RC auto;
//     die herkennen we aan de URL.
//   - Affiliate: de partnercode komt als ?p=... op de link, zie src/lib/shops.ts.
type Banggood struct {
	// eurRate is dollar → euro zoals de site rekent; Discover zet hem elke ronde opnieuw,
	// voordat de productpagina's opgehaald worden.
	eurRate float64
}

const banggoodNL = "https://nl.banggood.com"

func (*Banggood) Slug() string    { return "banggood" }
func (*Banggood) Name() string    { return "Banggood" }
func (*Banggood) BaseURL() string { return banggoodNL }
func (*Banggood) Description() string {
	return "Grote Chinese webwinkel met goedkope RC-auto's, werkvoertuigen, drones, helikopters, boten en vliegtuigen."
}

func (*Banggood) UserAgent() string { return shopifyUserAgent }

func (*Banggood) MinDelay() time.Duration { return 2 * time.Second }

// MaxProductPages: ~1.850 kandidaten; 1.500 per ronde is ~50 minuten bij MinDelay.
func (*Banggood) MaxProductPages() int { return 1500 }

// MinDealPercent ligt ruim boven wat de dollarkoers in een maand doet.
func (*Banggood) MinDealPercent() float64 { return 8 }

// banggoodCategories zijn de categorie-ID's die we nemen, met het label voor de indeling
// (zie categorize.Classify).
var banggoodCategories = map[int]string{
	1753: "RC auto's",
	264:  "Helikopter",
	1752: "Boten",
	1848: "Drones",
	8771: "FPV drones",
	1855: "Vliegtuigen",
}

var banggoodCategoryPages = []string{
	"Wholesale-RC-Car-c-1753.html",
	"Wholesale-RC-Helicopter-c-264.html",
	"Wholesale-RC-Boat-c-1752.html",
	"Wholesale-RC-Quadcopters-c-1848.html",
	"Wholesale-FPV-Racing-Drone-c-8771.html",
	"Wholesale-RC-Airplane-c-1855.html",
}

var (
	banggoodProductRe = regexp.MustCompile(`^https://nl\.banggood\.com/[^/?#]+-p-(\d+)\.html$`)
	// Voorselectie op de (Engelse) URL; de categorie-ID op de productpagina beslist.
	banggoodIncludeRe = regexp.MustCompile(`(?i)(?:^|-)(cars?|crawlers?|buggy|truggy|trucks?|drift|rally|excavators?|bulldozers?|loaders?|dump|cranes?|forklifts?|tractors?|helicopters?|heli|boats?|drones?|quadcopters?|whoop|airplanes?|planes?|gliders?|jets?|warbirds?|aircraft|rtr|rtf|bnf|pnp|arf)(?:-|$)`)
	banggoodExcludeRe = regexp.MustCompile(`(?i)(?:^|-)(parts?|spare|spareparts|replacement|upgrade[sd]?|accessor(?:y|ies)|propellers?|props?|blades?|motors?|engines?|esc|batter(?:y|ies)|lipo|chargers?|transmitters?|receivers?|servos?|frames?|fuselage|cameras?|goggles?|antennas?|tires?|tyres?|wheels?|rims?|shells?|body|canopy|cowling|gears?|screws?|nuts?|plugs?|bearings?|cables?|connectors?|switch|landing|guards?|bags?|case|box|holder|mount|stand|tools?|wrench|sticker|decal|module|board|controller|vtx|osd|stack|fc|aio|without|puzzle|building-blocks?|blocks|bricks?|diy|slot|shocks?|damper|arms?|axle|shaft|bumper|chassis|pinion|differential|tanks?|simulator|adapter|tube|launcher|catapult|gauge|lamps?|sensors?|flybarless-systems?|front|rear|alarm|finder|nozzle|rudder|joint|tape|boom|card|program(?:mer)?|cup|rubber-band|paper|foam-board|wings?|tail|skid|hatch|pcs|pairs?|set|link|rod|horn|hub|spring|wire|plate|bracket|clip|pin|velcro|strap|cover|seat|mirror|exhaust|fan|heatsink|cooling|pump|fuel|glow|starter)(?:-|$)`)
	// "...-for-RC-Car", "...-for-Wltoys-..." zijn accessoires voor een model, geen model.
	banggoodForRe  = regexp.MustCompile(`(?i)(?:^|-)(?:for|compatible-with|fits?)-(?:\d+-or-\d+-|1-\d+-)?(?:rc|remote|the|all|most|wltoys|mjx|syma|hubsan|eachine|dji|align|t-rex|trex|esky|wpl|traxxas|axial|scx\d*|trx\d*|tamiya|hsp|hpi|redcat|arrma|losi|kyosho|xk|feilun|udi|fms|volantex|e-?flite|walkera|blade|tarot)(?:-|$)`)
	banggoodWorkRe = regexp.MustCompile(`(?i)(?:^|-)(excavators?|bulldozers?|loaders?|dump-trucks?|dumpers?|cranes?|forklifts?|tractors?|road-rollers?|mixer-trucks?|engineering-vehicles?|construction)(?:-|$)`)

	banggoodRateRe    = regexp.MustCompile(`"EUR":\[([\d.]+)`)
	banggoodEurLossRe = regexp.MustCompile(`EurLoss\s*=\s*([\d.]+)`)
	banggoodPixelRe   = regexp.MustCompile(`'tikTokPixel':\s*(\{[^{}]*\})`)
)

func (s *Banggood) Discover(ctx context.Context, f *fetch.Fetcher) ([]string, []sitemap.URL, error) {
	if err := s.loadRate(ctx, f); err != nil {
		return nil, nil, err
	}
	seen := map[string]bool{}
	var products []sitemap.URL
	add := func(u sitemap.URL) {
		if !seen[u.Loc] {
			seen[u.Loc] = true
			products = append(products, u)
		}
	}
	// Populairste producten per categorie eerst: die zijn zeker van de goede categorie. Een
	// verse LastMod zet ze vooraan in de wachtrij (nooit bezochte pagina's: nieuwste eerst).
	now := time.Now()
	for _, page := range banggoodCategoryPages {
		doc, _, err := fetchDoc(ctx, f, banggoodNL+"/"+page)
		if err != nil {
			if ctx.Err() != nil {
				return nil, nil, ctx.Err()
			}
			continue
		}
		doc.Find(".goodlist li[data-product-id] a.title").Each(func(_ int, a *goquery.Selection) {
			if u := stripQuery(attr(a, "href")); banggoodProductRe.MatchString(u) {
				add(sitemap.URL{Loc: u, LastMod: now})
			}
		})
	}
	urls, err := sitemap.Fetch(ctx, f, banggoodNL+"/sitemap/product-index.xml", func(loc string) bool {
		return strings.Contains(loc, "/products-Toys-Hobbies-and-Robot-")
	})
	if err != nil && len(urls) == 0 && len(products) == 0 {
		return nil, nil, err
	}
	for _, u := range urls {
		if !banggoodProductRe.MatchString(u.Loc) {
			continue
		}
		slug := u.Loc[strings.LastIndexByte(u.Loc, '/')+1:]
		if banggoodIncludeRe.MatchString(slug) && !banggoodExcludeRe.MatchString(slug) && !banggoodForRe.MatchString(slug) {
			add(u)
		}
	}
	return nil, products, nil
}

// loadRate haalt de koers op waarmee de site dollars naar euro's omrekent.
func (s *Banggood) loadRate(ctx context.Context, f *fetch.Fetcher) error {
	resp, err := f.Get(ctx, banggoodNL+"/cache/static_cache_read/currency_huilv.js")
	if err != nil {
		return fmt.Errorf("wisselkoers: %w", err)
	}
	rate, loss, err := banggoodRate(string(resp.Body))
	if err != nil {
		return err
	}
	s.eurRate = rate * loss
	return nil
}

func banggoodRate(js string) (rate, loss float64, err error) {
	m := banggoodRateRe.FindStringSubmatch(js)
	if m == nil {
		return 0, 0, errors.New("wisselkoers: geen EUR in currency_huilv.js")
	}
	rate, _ = strconv.ParseFloat(m[1], 64)
	loss = 1
	if m := banggoodEurLossRe.FindStringSubmatch(js); m != nil {
		loss, _ = strconv.ParseFloat(m[1], 64)
	}
	if rate <= 0 || loss <= 0 {
		return 0, 0, errors.New("wisselkoers: ongeldige EUR-koers")
	}
	return rate, loss, nil
}

// ParseListing wordt niet gebruikt: listings hebben geen prijzen (zie boven).
func (s *Banggood) ParseListing(string, *goquery.Document) ([]parse.Product, string) {
	return nil, ""
}

type banggoodPixel struct {
	ContentID       json.Number `json:"content_id"`
	ContentCategory json.Number `json:"content_category"`
	ContentName     string      `json:"content_name"`
	Price           json.Number `json:"price"`
	Currency        string      `json:"currency"`
}

func (s *Banggood) ParseProduct(pageURL string, doc *goquery.Document) *parse.Product {
	var px banggoodPixel
	doc.Find("script:not([src])").EachWithBreak(func(_ int, sc *goquery.Selection) bool {
		m := banggoodPixelRe.FindStringSubmatch(sc.Text())
		if m == nil {
			return true
		}
		_ = json.Unmarshal([]byte(m[1]), &px)
		return false
	})
	url := firstNonEmpty(parse.Canonical(doc), stripQuery(pageURL))
	category, err := px.ContentCategory.Int64()
	if err != nil {
		return nil
	}
	label, ok := banggoodCategories[int(category)]
	if !ok {
		return nil
	}
	usd, _ := px.Price.Float64()
	if px.Currency != "USD" || usd <= 0 || s.eurRate <= 0 || px.ContentID == "" {
		return nil
	}
	slug := url[strings.LastIndexByte(url, '/')+1:]
	if category == 1753 && banggoodWorkRe.MatchString(slug) {
		label = "Werkvoertuigen"
	}
	p := &parse.Product{
		ExternalID:  px.ContentID.String(),
		URL:         url,
		Name:        firstNonEmpty(parse.Clean(px.ContentName), parse.MetaContent(doc, "og:title")),
		SKU:         attr(doc.Find(`input[name="sku"]`).First(), "value"),
		ImageURL:    parse.MetaContent(doc, "og:image"),
		Price:       math.Round(usd*s.eurRate*100) / 100,
		Breadcrumbs: []string{label},
	}
	if p.Name == "" {
		return nil
	}
	return p
}
