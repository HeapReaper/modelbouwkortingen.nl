package categorize

import "testing"

func TestClassify(t *testing.T) {
	cases := []struct {
		crumbs     []string
		hint, url  string
		name, want string
	}{
		{[]string{"Home", "RC Auto's", "Arrma"}, "", "", "ARRMA TALION 6S", "rc-autos"},
		{nil, "Electro auto's/Truck/Arrma RC/Aanbiedingen", "", "Arrma Big Rock", "rc-autos"},
		{[]string{"Wetronic Modelbouw", "Elektronica", "Zenders", "Zender Toebehoren", "Onderdelen per Merk"}, "", "", "Jeti Duplex TU2", "zenders"},
		{nil, "", "https://www.toprc.nl/onderdelen-en-toebehoren/accus-en-laders/lipo-accus/2s/", "x", "accus-laders"},
		{nil, "", "https://www.toprc.nl/onderdelen-en-toebehoren/auto-banden-en-velgen/1-op-10-crawler/", "x", "onderdelen"},
		{nil, "", "", "DJI Mini 4 Pro drone RTF met extra accu", "drones"},
		{nil, "", "", "E-flite P-47 Razorback PNP", "vliegtuigen"},
		{nil, "", "", "Huina 1/14 graafmachine 22 kanaals", "werkvoertuigen"},
		{nil, "", "", "Futaba T10J zender met R3008SB ontvanger", "zenders"},
		{nil, "", "", "Pro Boat Blackjack 24 catamaran RTR boat", "boten"},
		{nil, "", "", "Iets compleet onbekends", "overig"},
	}
	for _, c := range cases {
		if got := Classify(c.crumbs, c.hint, c.url, c.name); got != c.want {
			t.Errorf("Classify(%v, %q, %q, %q) = %q, want %q", c.crumbs, c.hint, c.url, c.name, got, c.want)
		}
	}
}

func TestClassifyNames(t *testing.T) {
	cases := map[string]string{
		"BlackZon Smyter MT Turbo 1/12 4WD 3S Brushless Elektrische Monstertruck met accu en lader": "rc-autos",
		"Flysky Noble NB4-Pro+ met 2 Ontvangers":                                                    "zenders",
		"ARRMA 1/7 Fireteam 6S 4WD BLX Speed Assault Vehicle RTR":                                   "rc-autos",
		"Tamiya RC Mercedes-Benz Arocs 4151 8×4 1/14 Tipper Truck":                                  "werkvoertuigen",
		"Traxxas banden voor Maxx monster truck":                                                    "onderdelen",
	}
	for name, want := range cases {
		if got := Classify(nil, "", "", name); got != want {
			t.Errorf("Classify(%q) = %q, want %q", name, got, want)
		}
	}
}
