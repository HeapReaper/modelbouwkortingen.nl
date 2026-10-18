package crawl

import (
	"testing"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
)

func TestIsUsed(t *testing.T) {
	used := []string{
		"Maverick RC Ion XT 1/18 Truck RTR Compleet Met Accu (Donor Chassis Gebruikt / Niet Compleet)!",
		"Arrma Mojave 4x4 4S in een nette staat met 1 jaar garantie",
		"Verkocht !!",
		"DJI Avata 2 - Fly Smart Combo (Three Batteries) (Tweede Kans)",
	}
	for _, n := range used {
		if !isUsed(parse.Product{Name: n}) {
			t.Errorf("isUsed(%q) = false", n)
		}
	}
	if isUsed(parse.Product{Name: "Traxxas Maxx 4S RTR", Breadcrumbs: []string{"RC Auto's"}}) {
		t.Error("nieuw product als gebruikt gezien")
	}
	if !isUsed(parse.Product{Name: "Kyosho MP9E", Breadcrumbs: []string{"Occasion", "Auto's"}}) {
		t.Error("occasion-breadcrumb niet herkend")
	}
}
