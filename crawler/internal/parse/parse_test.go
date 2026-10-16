package parse

import "testing"

func TestPrice(t *testing.T) {
	cases := map[string]float64{
		"€ 1.234,56":         1234.56,
		"€459,-":             459,
		"&euro;&nbsp;849,00": 849,
		"849":                849,
		"3.45":               3.45,
		"799":                799,
		"€ 12.999,00":        12999,
		"1.234":              1234,
		"Excl. BTW:€329,75":  329.75,
		"":                   0,
		"69.99":              69.99,
	}
	for in, want := range cases {
		if got := Price(in); got != want {
			t.Errorf("Price(%q) = %v, want %v", in, got, want)
		}
	}
}
