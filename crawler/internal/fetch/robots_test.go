package fetch

import "testing"

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
}
