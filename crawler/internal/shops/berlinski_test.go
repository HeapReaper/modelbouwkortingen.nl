package shops

import (
	"strings"
	"testing"

	"github.com/PuerkitoBio/goquery"
)

func TestBerlinskiNL(t *testing.T) {
	cases := []struct {
		price float64
		text  string
		want  float64
	}{
		{239.95, "inkl. 19% MwSt. zzgl. Versand nach Germany / Deutschland", 243.98},
		{243.98, "inkl. 21% MwSt. zzgl. Versand nach Netherlands", 243.98},
		{10.00, "", 10.00},
	}
	for _, c := range cases {
		if got := nlPrice(c.price, c.text); got != c.want {
			t.Errorf("nlPrice(%v, %q) = %v, want %v", c.price, c.text, got, c.want)
		}
	}
}

func TestBerlinskiGermanVAT(t *testing.T) {
	listing := `<html><body><div class="artbox fp" id="P54537"><div>
		<h5 class="title"><a href="https://www.modellbau-berlinski.de/x/y/m-07r">1:10 RC M-07R Onroad Chassis Kit</a></h5>
		<div class="price"><span class="uvp">270.00 &euro;</span><span class="product-price"> 239.95 &euro; </span></div>
		<div class="price-information">inkl. 19% MwSt. zzgl. <a href="versand">Versand</a> nach <a class="delivery-country">Germany / Deutschland</a></div>
	</div></div></body></html>`
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(listing))
	if err != nil {
		t.Fatal(err)
	}
	s := &Berlinski{}
	products, _ := s.ParseListing("https://www.modellbau-berlinski.de/x/y", doc)
	if len(products) != 1 || products[0].Price != 243.98 {
		t.Fatalf("listing: %+v", products)
	}

	page := `<html><body><div itemscope itemtype="http://schema.org/Product">
		<h1 itemprop="name">1:10 RC M-07R Onroad Chassis Kit</h1>
		<input id="menge_54537">
		<h2 itemprop="offers" itemscope itemtype="http://schema.org/Offer"><span itemprop="price">239.95</span></h2>
		<div class="price-additional-info">inkl. 19% MwSt. zzgl. <a href="versand">Versand</a> nach <a class="delivery-country">Germany / Deutschland</a></div>
	</div></body></html>`
	doc, err = goquery.NewDocumentFromReader(strings.NewReader(page))
	if err != nil {
		t.Fatal(err)
	}
	p := s.ParseProduct("https://www.modellbau-berlinski.de/x/y/m-07r", doc)
	if p == nil || p.Price != 243.98 {
		t.Fatalf("product: %+v", p)
	}
}
