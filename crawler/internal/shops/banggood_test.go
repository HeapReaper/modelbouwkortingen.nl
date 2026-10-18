package shops

import (
	"strconv"
	"strings"
	"testing"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/categorize"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/parse"
)

func banggoodPage(t *testing.T, canonical string, category int, price string) *parse.Product {
	t.Helper()
	html := `<html><head>
<link rel="canonical" href="` + canonical + `" />
<meta property="og:image" content="https://imgaz3.staticbg.com/x.jpg.webp">
</head><body><input name="sku" value="SKUL79297" />
<script>var pixels = {
      'tikTokPixel': {"content_id":2054368,"content_category":` + strconv.Itoa(category) + `,"content_type":"product","content_name":"YIGONG YG475 RTR 1\/50 2.4G RC Auto Laadkraan","price":"` + price + `","currency":"USD"},
      'kwaiPixel': null };</script></body></html>`
	doc, err := parse.Document([]byte(html), "text/html; charset=utf-8")
	if err != nil {
		t.Fatal(err)
	}
	s := &Banggood{}
	rate, loss, err := banggoodRate(`var CurrencyCfg={"USD":[1,"US$",true,"2"],"EUR":[0.8932,"€",true,"2"]};EurLoss=1.00338219;`)
	if err != nil {
		t.Fatal(err)
	}
	s.eurRate = rate * loss
	return s.ParseProduct(canonical+"?cur_warehouse=CN", doc)
}

func TestBanggoodProductPrice(t *testing.T) {
	p := banggoodPage(t, "https://nl.banggood.com/YIGONG-YG475-RTR-RC-Car-Loader-p-2054368.html", 1753, "85.99")
	if p == nil {
		t.Fatal("geen product")
	}
	// 85,99 × 0,8932 × 1,00338 = 77,07: wat de Nederlandse site toont.
	if p.Price != 77.07 || p.ExternalID != "2054368" || p.SKU != "SKUL79297" || !strings.HasPrefix(p.Name, "YIGONG") {
		t.Fatalf("onverwacht product: %+v", p)
	}
	if got := categorize.Classify(p.Breadcrumbs, p.CategoryHint, p.URL, p.Name); got != "werkvoertuigen" {
		t.Fatalf("categorie %q, wilde werkvoertuigen", got)
	}
}

func TestBanggoodCategories(t *testing.T) {
	for cat, want := range map[int]string{1753: "rc-autos", 264: "helicopters", 1752: "boten", 1848: "drones", 8771: "drones", 1855: "vliegtuigen"} {
		p := banggoodPage(t, "https://nl.banggood.com/Some-Model-RTR-p-1.html", cat, "10.00")
		if p == nil {
			t.Fatalf("categorie %d: geen product", cat)
		}
		if got := categorize.Classify(p.Breadcrumbs, p.CategoryHint, p.URL, p.Name); got != want {
			t.Errorf("categorie %d: %q, wilde %q", cat, got, want)
		}
	}
}

func TestBanggoodRejectsOtherCategories(t *testing.T) {
	s := &Banggood{eurRate: 0.9}
	html := `<html><head><link rel="canonical" href="https://nl.banggood.com/Blade-p-2.html" /></head><body>
<script>x = { 'tikTokPixel': {"content_id":2,"content_category":1813,"content_name":"Blade","price":"5.00","currency":"USD"}, }</script></body></html>`
	doc, _ := parse.Document([]byte(html), "text/html")
	if p := s.ParseProduct("https://nl.banggood.com/Blade-p-2.html", doc); p != nil {
		t.Fatalf("onderdeel niet overgeslagen: %+v", p)
	}
	if _, ok := s.rejected.Load("https://nl.banggood.com/Blade-p-2.html"); !ok {
		t.Fatal("afgewezen pagina niet onthouden")
	}
}

func TestBanggoodCandidateURLs(t *testing.T) {
	cases := map[string]bool{
		"WPL-C54-1-1-or-16-LC80-2_4G-4WD-RC-Car-Crawler-Vehicle-Models-Full-Proportional-Control-p-1985522.html":                   true,
		"RC-ERA-C129-V2-2_4G-4CH-6-Axis-Gyro-3D-Aerobatic-Flight-Altitude-Hold-Flybarless-RC-Helicopter-RTF-p-1977639.html":        true,
		"FMS-Red-Dragonfly-900mm-Wingspan-EPO-3D-Aerobatic-RC-Airplane-Trainer-Beginner-PNP-p-1691138.html":                        true,
		"HS-18-51-RTR-1-or-18-2_4G-4WD-36km-or-h-RC-Car-High-Speed-Off-Road-Truck-LED-Light-Full-Proportional-p-1.html":            true,
		"Wltoys-A949-1-or-18-Rc-Car-Parts-Canopy-A949-59-A949-60-p-930316.html":                                                    false,
		"Angel-Eye-Leds-For-1-10-RC-Car-Blue-or-White-p-921151.html":                                                               false,
		"KBAR-5_3_4-PRO-K8-3-Axis-Gyro-Flybarless-System-For-FBL-450-500-RC-Helicopter-p-939170.html":                              false,
		"Gemfan-1038-10x3_8-10-Inch-Carbon-Nylon-CW-or-CCW-Propeller-For-DJI-RC-Multirotor-FPV-Racing-Drone-p-961066.html":         false,
		"FlySky-FS-i6-2_4G-6CH-AFHDS-RC-Radio-Transmitter-With-FS-iA6-Receiver-for-FPV-RC-Drone-Engineering-Vehicle-p-922606.html": false,
	}
	for slug, want := range cases {
		got := banggoodIncludeRe.MatchString(slug) && !banggoodExcludeRe.MatchString(slug) && !banggoodForRe.MatchString(slug)
		if got != want {
			t.Errorf("%s: %v, wilde %v", slug, got, want)
		}
	}
}
