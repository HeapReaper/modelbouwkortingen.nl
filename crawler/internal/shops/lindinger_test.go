package shops

import (
	"strings"
	"testing"

	"github.com/PuerkitoBio/goquery"
)

func TestLindingerInStock(t *testing.T) {
	cases := []struct {
		schema, title string
		want          bool
	}{
		{"InStock", "Auf Lager. Lieferzeit 1-3 Werktage.", true},
		{"LimitedAvailability", "Auf Lager. Lieferzeit 1-3 Werktage.", true},
		{"InStock", "Nur noch wenige auf Lager. Lieferzeit 1-3 Werktage.", false},
		{"LimitedAvailability", "Vorbestellung möglich. Nicht lagernd. Verfügbar ab ca. 30.11.2026.", false},
	}
	for _, c := range cases {
		card := `<div class="card product-box">
			<input name="lineItems[abc][id]" value="abc">
			<a class="product-name" href="https://www.lindinger.at/de/RC-Elektronik/Servos-Zubehoer/Servo/123" title="Servo">Servo</a>
			<div class="product-price">25,99 €</div>
			<div class="product-delivery-information"><link itemprop="availability" href="http://schema.org/` + c.schema + `"/>
			<p class="delivery-information"><span class="delivery-status-indicator" title="` + c.title + `"></span></p></div>
		</div>`
		doc, err := goquery.NewDocumentFromReader(strings.NewReader(card))
		if err != nil {
			t.Fatal(err)
		}
		products, _ := (&Lindinger{}).ParseListing("https://www.lindinger.at/de/RC-Elektronik/Servos-Zubehoer/", doc)
		if len(products) != 1 || products[0].InStock == nil || *products[0].InStock != c.want {
			t.Errorf("%q: got %+v, want InStock=%v", c.title, products, c.want)
		}
	}
}
