package shops

import (
	"math"
	"regexp"
	"strconv"
	"strings"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
)

// Alle prijzen op de site zijn prijzen bij levering in Nederland. Sommige shops rekenen de btw
// van het afleverland, maar de crawler ziet dan iets anders dan een Nederlandse bezoeker:
//
//   - IP-adres: Berlinski en Metz kiezen het land op IP, en de crawler draait in Duitsland.
//     Die pagina's noemen het tarief, dus daar rekenen we om met nlPrice.
//   - User-agent: JTL-Shop slaat de landherkenning over voor bots. Tamico geeft ons dan 19%,
//     GHW zelfs 0%. Listings noemen geen tarief, dus daar geldt een vaste PriceFactor.
//   - Shopify Markets: de cookie localization=NL geeft de echte NL-prijs (Hoellein, RC Team).
//   - API: de WooCommerce Store API van MRC Modélisme geeft prijzen zonder btw.
//
// Shops die altijd hun eigen btw tonen en niet zeggen wat er bij levering in Nederland gebeurt,
// laten we staan; het tarief staat dan bij de prijs (ShopInfo.vat in src/lib/shops.ts).

// nlVAT is het btw-tarief in Nederland, in procenten.
const nlVAT = 21.0

// shopifyNLCookie kiest in Shopify Markets de Nederlandse prijzen.
const shopifyNLCookie = "localization=NL"

// germanToNL rekent een prijs inclusief 19% Duitse btw om naar 21%.
const germanToNL = (100 + nlVAT) / 119

// PriceFactor is voor shops waarvan de crawler structureel een andere prijs ziet dan een
// Nederlandse koper betaalt. Elke prijs wordt met deze factor vermenigvuldigd.
//
// Wijzig je de factor van een shop, reken dan ook de opgeslagen prijzen en prijshistorie om met
// een migratie (zie 20261104120000_nl_vat): anders lijkt de wijziging een prijsdaling of -stijging.
type PriceFactor interface {
	PriceFactor() float64
}

// AdjustPrices past de PriceFactor van de shop toe op een geparst product.
func AdjustPrices(shop Shop, p *parse.Product) {
	pf, ok := shop.(PriceFactor)
	if !ok {
		return
	}
	p.Price = roundCents(p.Price * pf.PriceFactor())
	p.OldPrice = roundCents(p.OldPrice * pf.PriceFactor())
}

var vatRateRe = regexp.MustCompile(`(?i)in[kc]l\.\s*(\d+(?:[.,]\d+)?)\s*%\s*(?:MwSt|USt)`)

// nlPrice rekent een prijs inclusief de btw uit text ("inkl. 19% MwSt.") om naar een prijs
// inclusief Nederlandse btw. Zonder btw-tekst blijft de prijs zoals hij is.
func nlPrice(price float64, text string) float64 {
	m := vatRateRe.FindStringSubmatch(text)
	if m == nil {
		return price
	}
	rate, err := strconv.ParseFloat(strings.Replace(m[1], ",", ".", 1), 64)
	if err != nil || rate == nlVAT {
		return price
	}
	return roundCents(price / (1 + rate/100) * (1 + nlVAT/100))
}

func roundCents(v float64) float64 { return math.Round(v*100) / 100 }
