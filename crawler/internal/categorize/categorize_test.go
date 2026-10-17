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
		{nil, "Accessoires | RC | Remote controllers", "", "DJI RC 2", "zenders"},
		{nil, "Onderdelen | Accu | Drones", "", "DJI Mini 4 Pro Intelligent Flight Battery", "accus-laders"},
		{nil, "Drones | Camera | Luchtfotografie", "", "DJI Neo", "drones"},
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

// Duitse shops (Hoellein, Berlinski, MG-Modellbau, Hacker) gebruiken Duitse categorieën.
func TestClassifyGerman(t *testing.T) {
	cases := []struct {
		crumbs     []string
		hint, name string
		want       string
	}{
		{[]string{"Regler", "Flug"}, "RC Elektronik und Akkus | Regler | Flug", "AVICON 20A S-BEC Brushless Regler", "elektronica"},
		{[]string{"Fernsteuerungen", "Zubehör", "Jeti Zubehör"}, "", "Jeti USB-Adapter", "zenders"},
		{[]string{"Elektromotoren", "Hacker Außenläufer", "Hacker A20"}, "", "A20-26 M EVO kv1130", "elektronica"},
		{nil, " | carbon | klappluftschrauben", "CFK Klappluftschraube RFM 16,0x8,0", "onderdelen"},
		{nil, " | akkus", "SLS LiPo Akku XTRON 1S/350mAh", "accus-laders"},
		{[]string{"RC Flugzeuge und Zubehör", "Segelflugzeuge"}, "", "Multiplex Heron RR", "vliegtuigen"},
		{[]string{"RC Schiffe und Zubehör", "Rennboote"}, "", "Pro Boat Recoil 2", "boten"},
		{[]string{"Traxxas", "Aandrijving & transmissie", "Tandwielen / pinions / spur gears"}, "", "Traxxas TRX6790X Gear adapters", "onderdelen"},
		{nil, "Tuning- & Teile | Panzer", "Tamiya Kettenglieder Leopard 2A6", "onderdelen"},
		{nil, "RC-Trucks | Panzer", "Tamiya 56020 Panzer Leopard 2A6 Full Option 1:16 Bausatz", "tanks"},
		{nil, "RC-Elektronik | Akkus", "Carson LiFe Akku 6,6V 1600mAh", "accus-laders"},
	}
	for _, c := range cases {
		if got := Classify(c.crumbs, c.hint, "", c.name); got != c.want {
			t.Errorf("Classify(%v, %q, %q) = %q, want %q", c.crumbs, c.hint, c.name, got, c.want)
		}
	}
}
