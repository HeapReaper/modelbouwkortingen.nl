package store

import (
	"context"
	"os"
	"testing"

	"github.com/heapreaper/modelbouwkortingen/crawler/internal/parse"
)

// Integratietest: draait alleen met TEST_DATABASE_URL (een gemigreerde, wegwerpbare database).
func TestDealLifecycle(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL niet gezet")
	}
	ctx := context.Background()
	s, err := Open(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer s.Close()
	shopID, err := s.EnsureShop(ctx, "testshop", "Testshop", "https://example.com", "")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _, _ = s.pool.Exec(ctx, `DELETE FROM shops WHERE id=$1`, shopID) })

	rules := DealRules{MinEUR: 5, MinPercent: 5}
	steps := []struct {
		price, old float64
		deal       bool
		ref        float64
	}{
		{100, 150, false, 0}, // eerste waarneming = nulmeting, "van"-prijs telt niet
		{100, 150, false, 0}, // ongewijzigd
		{97, 0, false, 100},  // 3% lager: te weinig voor een deal
		{94, 0, true, 100},   // 6% onder de hoogste eerdere prijs
		{90, 0, true, 100},   // verder gezakt: deal blijft, referentie vast
		{90, 0, true, 100},   // ongewijzigd: deal blijft
		{92, 0, false, 0},    // weer gestegen: deal voorbij, nieuwe nulmeting
		{92, 0, false, 0},    // nog steeds 8% onder 100, maar oude historie telt niet meer
		{86, 0, true, 92},    // nieuwe daling t.o.v. de nieuwe nulmeting
	}
	for i, st := range steps {
		p := parse.Product{ExternalID: "x1", URL: "https://example.com/x1", Name: "Test", Price: st.price, OldPrice: st.old}
		res, err := s.UpsertProduct(ctx, shopID, p, "overig", true, rules)
		if err != nil {
			t.Fatalf("stap %d: %v", i, err)
		}
		var ref *float64
		if err := s.pool.QueryRow(ctx, `SELECT reference_price::float8 FROM products WHERE shop_id=$1 AND external_id='x1'`,
			shopID).Scan(&ref); err != nil {
			t.Fatal(err)
		}
		gotRef := 0.0
		if ref != nil {
			gotRef = *ref
		}
		if res.IsDeal != st.deal || gotRef != st.ref {
			t.Errorf("stap %d (prijs %.2f): deal=%v ref=%.2f, verwacht deal=%v ref=%.2f",
				i, st.price, res.IsDeal, gotRef, st.deal, st.ref)
		}
	}
}
