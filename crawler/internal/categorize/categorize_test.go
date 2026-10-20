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
		{[]string{"R/C", "Tamiya", "Tamiya R/C Monster Trucks"}, "", "", "Tamiya Lunch Box Black Edition", "rc-autos"},
		{[]string{"R/C", "Tamiya", "Tamiya R/C Buggy's"}, "", "", "Tamiya Subaru Brat", "rc-autos"},
		{[]string{"R/C", "Tamiya", "Tamiya R/C Trucks"}, "", "", "Tamiya Scania R470", "werkvoertuigen"},
		{[]string{"1/10 Touring Car Bodies"}, "", "", "BittyDesign Ahura 1/10 GT 190mm", "onderdelen"},
		{[]string{"Motors & Speed Controllers", "Speed Controllers"}, "", "", "Hobbywing XR10 Pro", "elektronica"},
		{[]string{"Opladers"}, "", "", "SkyRC G630", "accus-laders"},
		{[]string{"Color Spray TS"}, "", "", "Tamiya TS-11 Maroon 100ml", "gereedschap"},
		{[]string{"XRAY Hardware pin-screws-O-rings"}, "", "", "XRAY Pin 2x10", "onderdelen"},
		{[]string{"Pinions 48DP"}, "", "", "Arrowmax 48DP 21T", "onderdelen"},
		{[]string{"Pièces détachées", "Traxxas", "Rustler – 4×2 – 1/10"}, "", "", "Triangle avant Rustler", "onderdelen"},
		{[]string{"Hélicoptères"}, "", "", "Goosky S2 BNF", "helicopters"},
		{[]string{"Moteurs Variateurs", "Variateurs"}, "", "", "Hobbywing Xerun XR10", "elektronica"},
		{[]string{"Voiture RC tout-terrain"}, "", "", "MINI MAXX BL-2S USB AVEC ACCUS / CHARGEUR USB noir", "rc-autos"},
		{[]string{"Chargeurs"}, "fpv", "", "ISDT 608AC", "accus-laders"},
		{[]string{"Hélices"}, "fpv", "", "HQProp 5x4.3x3 (2CW+2CCW)", "onderdelen"},
		{[]string{"Drones prêts à voler"}, "fpv", "", "DFR Nazgul5 V3 6S", "drones"},
		{[]string{"Serpent"}, "", "", "Serpent pignon 17T module 0,6", "onderdelen"},
		{nil, "Planeurs", "", "Kavan Alfa 1,5m", "vliegtuigen"},
		{nil, "", "", "Bateau Pro Boat Recoil 2 26 brushless RTR", "boten"},
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
		{nil, "trucks | rc opleggers", "Tamiya Trailer 3-assig", "werkvoertuigen"},
		{nil, "bouwmachines", "Huina 1592 kiepwagen", "werkvoertuigen"},
		{nil, "rc auto s | traxxas", "TRAXXAS Rustler 4x4 rood RTR met accu + LED-verlichting", "rc-autos"},
		{nil, "Helicopters | E-FLITE | E-Flite Blade 180 CFX", "BLADE Trio 180 CFX BNF Basic", "helicopters"},
		{nil, "Helicopters | SAB GOBLIN | Goblin RAW 420 | Repuestos Competition", "Steel Main Shaft", "onderdelen"},
		{nil, "Main Blades | SAB Blackline", "SAB 600mm Blackline", "onderdelen"},
		{nil, "Electronics | Transmitters | Futaba", "Futaba T16IZ", "zenders"},
		{nil, "RC Planes | E-FLITE", "E-flite Timber X 1.2m", "vliegtuigen"},
		{nil, "LiHV", "CNHL Lightning LiHV 3200mAh 15,2V 4S 120C HV Lipo-accu met XT60-stekker", "accus-laders"},
	}
	for _, c := range cases {
		if got := Classify(c.crumbs, c.hint, "", c.name); got != c.want {
			t.Errorf("Classify(%v, %q, %q) = %q, want %q", c.crumbs, c.hint, c.name, got, c.want)
		}
	}
}
