package fetch

import (
	"testing"
	"time"
)

func TestRobots(t *testing.T) {
	r := ParseRobots(`User-agent: AhrefsBot
Disallow: /

User-agent: *
Disallow: /*?
Disallow: /*.php$
Disallow: /checkout/
Allow: /checkout/cart-info$
Disallow: /*page/
`, "ModelbouwkortingenBot")
	cases := map[string]bool{
		"/":                       true,
		"/rc-autos/":              true,
		"/rc-autos/?p=2":          false,
		"/index.php":              false,
		"/index.php/foo":          true,
		"/checkout/":              false,
		"/checkout/cart-info":     true,
		"/rc-autos/page/2/":       false,
		"/product/foo-bar":        true,
		"/arrma-big-rock-6s.html": true,
	}
	for path, want := range cases {
		if got := r.Allowed(path); got != want {
			t.Errorf("Allowed(%q) = %v, want %v", path, got, want)
		}
	}
	if ParseRobots("User-agent: AhrefsBot\nDisallow: /\n", "AhrefsBot").Allowed("/x") {
		t.Error("specifieke groep moet gelden")
	}
	if d := r.CrawlDelay; d != 0 {
		t.Errorf("CrawlDelay = %v, want 0", d)
	}
	cd := ParseRobots("User-agent: *\nCrawl-delay: 10\nDisallow: /cart/\n\nUser-agent: AhrefsBot\nCrawl-delay: 30\n", "ModelbouwkortingenBot")
	if cd.CrawlDelay != 10*time.Second || cd.Allowed("/cart/") {
		t.Errorf("Crawl-delay groep: delay=%v cart=%v", cd.CrawlDelay, cd.Allowed("/cart/"))
	}
}
