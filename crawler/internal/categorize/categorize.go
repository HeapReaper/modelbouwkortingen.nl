// Package categorize deelt producten in onze eigen categorieën in op basis van de
// breadcrumbs/categorie van de webshop en de productnaam.
package categorize

import (
	"strings"
	"unicode"
)

type rule struct {
	slug     string
	keywords []string
}

// Volgorde is belangrijk: specifieke dingen (zenders, accu's, onderdelen) gaan
// vóór voertuigtypes, zodat "banden voor RC auto" onder Onderdelen valt.
var rules = []rule{
	{"zenders", []string{"zender", "zenders", "ontvanger", "ontvangers", "transmitter", "receiver", "radiografische set", "afstandsbediening", "telemetrie", "radio set", "rc systeem", "remote controller", "remote controllers", "sender", "handsender", "empfänger", "empfaenger", "fernsteuerung", "fernsteuerungen", "fernsteuerungsanlage", "fernsteueranlage"}},
	{"accus-laders", []string{"accu", "accus", "accu's", "lipo", "li-po", "nimh", "li-ion", "lader", "laders", "charger", "voeding", "batterij", "batterijen", "battery", "batteries", "akku", "akkus", "empfängerakku", "empfängerakkus", "empfaengerakkus", "senderakku", "ladegerät", "ladegeraet", "ladegeräte", "ladetechnik", "netzteil", "netzteile", "akkuweiche", "akkuweichen", "batterie", "batterien"}},
	{"gereedschap", []string{"gereedschap", "tools", "schroevendraaier", "inbussleutel", "steeksleutel", "tang", "werkstandaard", "car stand", "pitmat", "lijm", "soldeer", "verf", "spuitbus", "airbrush", "werkzeug", "werkzeuge", "werkstattzubehör", "werkstattzubehoer", "kleber", "klebstoff", "sekundenkleber", "farbe", "farben", "lötzinn", "lötkolben"}},
	{"elektronica", []string{"elektronica", "servo", "servos", "servo's", "regelaar", "esc", "snelheidsregelaar", "brushless motor", "borstelmotor", "motoren", "motor", "gyro", "flight controller", "vliegcontroller", "fpv camera", "vtx", "verlichting", "led", "sound module", "geluidsmodule", "bec", "sensor", "elektronik", "regler", "fahrtregler", "drehzahlregler", "elektromotor", "elektromotoren", "außenläufer", "aussenlaeufer", "innenläufer", "innenlaeufer", "kreisel", "beleuchtung", "schalter", "aussenläufer", "outrunner", "inrunner", "elektroantriebe", "lichter"}},
	{"onderdelen", []string{"onderdelen", "onderdeel", "parts", "spare", "spare parts", "toebehoren", "accessoires", "upgrade", "upgrades", "banden", "velgen", "wielen", "tires", "wheels", "kogellager", "lagers", "bearing", "tandwiel", "pinion", "spur", "aandrijfas", "driveshaft", "draagarm", "schokdemper", "schokdempers", "shocks", "karrosserie", "carrosserie", "body", "bodyshell", "chassis onderdelen", "schroeven", "schroevenset", "propeller", "propellers", "rotorblad", "rotorbladen", "differentieel", "hop-up", "hop up", "tandwielen", "aandrijving", "ersatzteil", "ersatzteile", "tuningteile", "reifen", "felgen", "räder", "raeder", "kugellager", "zahnrad", "zahnräder", "ritzel", "hauptzahnrad", "luftschraube", "luftschrauben", "klappluftschraube", "klappluftschrauben", "starrluftschrauben", "karosserie", "stoßdämpfer", "dämpfer", "daempfer", "schrauben", "querlenker", "antriebswelle", "rotorblätter", "servohebel", "gestänge", "spinner", "fahrwerk", "einziehfahrwerk", "einziehfahrwerke", "servoersatzteile"}},
	{"drones", []string{"drone", "drones", "quadcopter", "multicopter", "fpv", "multikopter", "multicopter", "kopter"}},
	{"helicopters", []string{"helicopter", "helicopters", "helikopter", "heli", "heli's", "hubschrauber"}},
	{"vliegtuigen", []string{"vliegtuig", "vliegtuigen", "airplane", "plane", "zweefvliegtuig", "zwever", "jet", "edf", "warbird", "trainer", "glider", "pnp", "bnf", "arf", "flugzeug", "flugzeuge", "modellflugzeug", "modellflugzeuge", "segler", "segelflugzeug", "segelflugzeuge", "impeller", "flugmodell", "flugmodelle", "freiflugmodelle", "motorflugzeug"}},
	{"boten", []string{"boot", "boten", "boat", "boats", "scheepsmodel", "scheepsmodellen", "speedboot", "zeilboot", "schip", "schepen", "jacht", "sleepboot", "duikboot", "onderzeeboot", "boote", "schiff", "schiffe", "schiffsmodell", "schiffsmodelle", "rennboot"}},
	{"tanks", []string{"tank", "tanks", "panzer", "militair", "military", "leopard", "sherman", "tiger"}},
	{"werkvoertuigen", []string{"werkvoertuig", "werkvoertuigen", "trailer", "aanhanger", "container", "graafmachine", "graafmachines", "graver", "excavator", "bulldozer", "shovel", "wiellader", "loader", "kraan", "crane", "dumper", "kiepwagen", "kipper", "tractor", "trekker", "oplegger", "dieplader", "tipper", "arocs", "vrachtwagen", "vrachtwagens", "trucks 1/14", "1/14 truck", "scania", "actros", "volvo fh", "man tgx", "brandweer", "hydrauliek", "hydraulisch", "lkw", "rc trucks", "bagger", "radlader", "sattelzug", "auflieger", "anhänger", "traktor", "baumaschine", "baumaschinen"}},
	{"rc-autos", []string{"auto", "autos", "auto's", "rc auto", "car", "cars", "buggy", "truggy", "crawler", "crawlers", "monster truck", "monstertruck", "short course", "drift", "touring", "onroad", "on-road", "offroad", "off-road", "rally", "basher", "rock racer", "desert truck", "speed truck", "stadium truck", "fahrzeug", "fahrzeuge", "rennwagen", "geländewagen"}},
}

var vehicleSlugs = map[string]bool{
	"drones": true, "helicopters": true, "vliegtuigen": true, "boten": true,
	"tanks": true, "werkvoertuigen": true, "rc-autos": true,
}

// Classify geeft de slug van onze categorie. De categorie van de webshop
// (breadcrumbs) weegt het zwaarst, daarna de categorie-hint, de URL en de naam.
func Classify(breadcrumbs []string, categoryHint, url, name string) string {
	for _, text := range []string{strings.Join(breadcrumbs, " | "), categoryHint, urlPath(url)} {
		if slug := match(text, false); slug != "" {
			return slug
		}
	}
	// "RTR", "BNF" etc. in de naam betekent bijna altijd een compleet model,
	// ook als er "met accu en lader" achter staat.
	nameTokens := " " + strings.Join(tokenize(name), " ") + " "
	complete := false
	for _, kw := range []string{"rtr", "rts", "artr", "bnf", "pnp", "arf", "rtf"} {
		if strings.Contains(nameTokens, " "+kw+" ") {
			complete = true
			break
		}
	}
	if complete {
		if slug := match(name, true); slug != "" {
			return slug
		}
		return "rc-autos" // compleet model zonder herkenbaar type is vrijwel altijd een auto
	}
	if slug := matchName(name); slug != "" {
		return slug
	}
	return "overig"
}

// matchName kiest bij productnamen het keyword dat het eerst voorkomt: het hoofdwoord
// staat meestal vooraan ("Monstertruck ... met accu en lader"), tenzij het duidelijk om
// een onderdeel gaat.
func matchName(name string) string {
	words := tokenize(name)
	if len(words) == 0 {
		return ""
	}
	joined := " " + strings.Join(words, " ") + " "
	for _, r := range rules {
		if r.slug != "onderdelen" {
			continue
		}
		for _, kw := range r.keywords {
			if strings.Contains(joined, " "+kw+" ") {
				return r.slug
			}
		}
	}
	best, bestPos := "", len(joined)
	for _, r := range rules {
		for _, kw := range r.keywords {
			if i := strings.Index(joined, " "+kw+" "); i >= 0 && i < bestPos {
				best, bestPos = r.slug, i
			}
		}
	}
	return best
}

// match zoekt de eerste regel waarvan een keyword voorkomt. Met vehiclesFirst
// worden de voertuigcategorieën eerst geprobeerd.
func match(text string, vehiclesFirst bool) string {
	words := tokenize(text)
	if len(words) == 0 {
		return ""
	}
	joined := " " + strings.Join(words, " ") + " "
	try := func(r rule) bool {
		for _, kw := range r.keywords {
			if strings.Contains(joined, " "+kw+" ") {
				return true
			}
		}
		return false
	}
	if vehiclesFirst {
		for _, r := range rules {
			if vehicleSlugs[r.slug] && try(r) {
				return r.slug
			}
		}
	}
	for _, r := range rules {
		if try(r) {
			return r.slug
		}
	}
	return ""
}

func tokenize(s string) []string {
	rs := []rune(strings.ToLower(s))
	// "/" alleen behouden tussen cijfers (schaal zoals 1/14), anders is het een scheidingsteken.
	for i, r := range rs {
		if r == '/' && !(i > 0 && i < len(rs)-1 && unicode.IsDigit(rs[i-1]) && unicode.IsDigit(rs[i+1])) {
			rs[i] = ' '
		}
	}
	return strings.FieldsFunc(string(rs), func(r rune) bool {
		return !(unicode.IsLetter(r) || unicode.IsDigit(r) || r == '\'' || r == '/')
	})
}

func urlPath(u string) string {
	if i := strings.Index(u, "://"); i >= 0 {
		u = u[i+3:]
	}
	if i := strings.IndexByte(u, '/'); i >= 0 {
		u = u[i:]
	}
	return strings.NewReplacer("-", " ", "_", " ", "/", " ", ".html", "").Replace(u)
}
