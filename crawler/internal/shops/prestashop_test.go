package shops

import (
	"testing"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/categorize"
)

func TestPrestaShopListing(t *testing.T) {
	body := []byte(`{"products":[` +
		`{"id_product":"1006700","name":"MINI MAXX BL-2S USB AVEC ACCUS \/ CHARGEUR USB noir","reference":"030-TRX107154-1-BLK",` +
		`"manufacturer_name":"TRAXXAS","category_name":"Voiture RC tout-terrain","url":"https://www.flashrc.com/fr/x/1006700-mini-maxx.html",` +
		`"canonical_url":"https://www.flashrc.com/fr/voiture-rc-tout-terrain/1006700-mini-maxx.html","price_amount":269,"regular_price_amount":299.9,` +
		`"cover":{"large":{"url":"https://www.flashrc.com/127694-large_default/mini-maxx.jpg"}}},` +
		`{"id_product":"24822","name":"Bague plastique 5X11X4MM S8 HPI - 85644","reference":"85644","manufacturer_name":"HPI",` +
		`"category_name":"HPI","url":"https://www.flashrc.com/fr/hpi/24822-bague.html","canonical_url":"","price_amount":3.05,"regular_price_amount":3.05,"cover":false},` +
		`{"id_product":"5","name":"T-shirt FlashRC","reference":"","manufacturer_name":"","category_name":"Vêtements","url":"https://www.flashrc.com/fr/5-t-shirt.html","price_amount":20,"regular_price_amount":20,"cover":false}` +
		`],"pagination":{"total_items":21376,"current_page":7,"pages_count":214}}`)
	pageURL := "https://www.flashrc.com/fr/2-accueil?ajax=1&resultsPerPage=100&page=7"
	products, next := (&FlashRC{}).ParseListingRaw(pageURL, body)
	if len(products) != 2 {
		t.Fatalf("got %d producten, want 2 (kleding overgeslagen)", len(products))
	}
	if next != "https://www.flashrc.com/fr/2-accueil?ajax=1&page=8&resultsPerPage=100" {
		t.Errorf("next = %q", next)
	}
	p := products[0]
	if p.ExternalID != "1006700" || p.SKU != "030-TRX107154-1-BLK" || p.Brand != "TRAXXAS" || p.URL != "https://www.flashrc.com/fr/voiture-rc-tout-terrain/1006700-mini-maxx.html" {
		t.Errorf("id/sku/merk/url = %q %q %q %q", p.ExternalID, p.SKU, p.Brand, p.URL)
	}
	if p.Price != 269 || p.OldPrice != 299.9 || p.InStock != nil || p.ImageURL == "" {
		t.Errorf("prijs %v van %v, voorraad %v, foto %q", p.Price, p.OldPrice, p.InStock, p.ImageURL)
	}
	if got := categorize.Classify(p.Breadcrumbs, p.CategoryHint, p.URL, p.Name); got != "rc-autos" {
		t.Errorf("categorie auto = %q", got)
	}
	// Zonder foto is cover false; zonder canonical_url de gewone url.
	q := products[1]
	if q.ImageURL != "" || q.OldPrice != 0 || q.URL != "https://www.flashrc.com/fr/hpi/24822-bague.html" {
		t.Errorf("foto %q, van %v, url %q", q.ImageURL, q.OldPrice, q.URL)
	}

	// Laatste pagina: geen volgende.
	last := []byte(`{"products":[{"id_product":"57","name":"ISDT P20 2X500W","category_name":"Chargers","url":"https://www.e-rc.be/chargers/57-isdt-p20-2x500w.html","price_amount":120,"regular_price_amount":120,"cover":false}],"pagination":{"current_page":4,"pages_count":4}}`)
	products, next = (&ERC{}).ParseListingRaw("https://www.e-rc.be/2-home?ajax=1&resultsPerPage=100&page=4", last)
	if len(products) != 1 || next != "" {
		t.Fatalf("got %d producten, next %q", len(products), next)
	}
	if got := categorize.Classify(products[0].Breadcrumbs, products[0].CategoryHint, products[0].URL, products[0].Name); got != "accus-laders" {
		t.Errorf("categorie lader = %q", got)
	}
}

func TestRCNMoreSitemap(t *testing.T) {
	body := []byte(`<urlset>
<url><loc>https://rcn-more.be/helikopters</loc><xhtml:link rel="alternate" hreflang="nl" href="https://rcn-more.be/helikopters" /></url>
<url><loc>https://rcn-more.be/traxxas-parts/trx1647-silicone-grease</loc>
<xhtml:link rel="alternate" hreflang="nl" href="https://rcn-more.be/traxxas-parts/trx1647-silicone-grease" />
<xhtml:link rel="alternate" hreflang="en" href="https://rcn-more.be/en/detail/4961420-trx1647-silicone-grease" /></url>
<url><loc>https://rcn-more.be/en/detail/4961420-trx1647-silicone-grease</loc>
<xhtml:link rel="alternate" hreflang="nl" href="https://rcn-more.be/traxxas-parts/trx1647-silicone-grease" /></url>
<url><loc>https://rcn-more.be/canopies/fuselages</loc><xhtml:link rel="alternate" hreflang="nl" href="https://rcn-more.be/canopies/rompen" /></url>
<url><loc>https://rcn-more.be/sab-kits/sg570-goblin-570-red/yel-sg570</loc></url>
<url><loc>https://rcn-more.be/webshop/911582-vet</loc></url>
</urlset>`)
	var got []string
	for _, u := range rcnmoreProducts(body) {
		got = append(got, u.Loc)
	}
	want := []string{"https://rcn-more.be/traxxas-parts/trx1647-silicone-grease", "https://rcn-more.be/sab-kits/sg570-goblin-570-red/yel-sg570"}
	if len(got) != len(want) || got[0] != want[0] || got[1] != want[1] {
		t.Errorf("got %q, want %q", got, want)
	}
}
