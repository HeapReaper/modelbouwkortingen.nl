package shops

import (
	"testing"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
)

func TestAdjustPrices(t *testing.T) {
	cases := []struct {
		shop           Shop
		price, old     float64
		wantP, wantOld float64
	}{
		{&Tamico{}, 239.99, 0, 244.02, 0}, // de melding die dit aan het licht bracht
		{&Tamico{}, 86.99, 99.99, 88.45, 101.67},
		{&GHW{}, 4.54, 0, 5.49, 0},
		{&Bauer{}, 16.95, 0, 17.23, 0},
		{&MRCModelisme{}, 16.58, 0, 19.90, 0},
		{&MRCModelisme{}, 91.58, 0, 109.90, 0},
		{&Toemen{}, 29.99, 64.99, 29.99, 64.99}, // geen PriceFactor: ongewijzigd
	}
	for _, c := range cases {
		p := parse.Product{Price: c.price, OldPrice: c.old}
		AdjustPrices(c.shop, &p)
		if p.Price != c.wantP || p.OldPrice != c.wantOld {
			t.Errorf("%s: %v/%v → %v/%v, want %v/%v", c.shop.Slug(), c.price, c.old, p.Price, p.OldPrice, c.wantP, c.wantOld)
		}
	}
}

func TestNLPrice(t *testing.T) {
	cases := []struct {
		price float64
		text  string
		want  float64
	}{
		{199, "inkl. 19% MwSt. zzgl. Versand", 202.34},
		{100, "incl. 20% USt.", 100.83},
		{5.03, "inkl. 21% MwSt.", 5.03},
		{5, "inkl. MwSt.", 5},
		{0, "inkl. 19% MwSt.", 0},
	}
	for _, c := range cases {
		if got := nlPrice(c.price, c.text); got != c.want {
			t.Errorf("nlPrice(%v, %q) = %v, want %v", c.price, c.text, got, c.want)
		}
	}
}
