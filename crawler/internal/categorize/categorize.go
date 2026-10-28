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
	{"zenders", []string{"zender", "zenders", "ontvanger", "ontvangers", "transmitter", "receiver", "radiografische set", "afstandsbediening", "telemetrie", "radio set", "rc systeem", "remote controller", "remote controllers", "transmitters", "receivers", "recievers", "sender", "handsender", "empfänger", "empfaenger", "fernsteuerung", "fernsteuerungen", "fernsteuerungsanlage", "fernsteueranlage", "radios", "radio émetteurs", "récepteur", "récepteurs", "recepteur", "recepteurs", "ensemble radio", "ensembles radio", "telemetry", "emisora", "emisoras", "receptor", "receptores", "radiocomandi", "radiocomando", "trasmettitore", "trasmettitori", "ricevente", "riceventi", "ricevitore", "ricevitori", "emissor", "emissores", "recetor", "recetores", "rádios", "cristal", "cristales", "quarzo", "quarzi", "radio auto", "radio aereo", "radio elicottero"}},
	{"accus-laders", []string{"accu", "accus", "accu's", "lipo", "li-po", "lihv", "nimh", "li-ion", "lader", "laders", "oplader", "opladers", "charger", "voeding", "batterij", "batterijen", "battery", "batteries", "bateries", "lipos", "chargers", "akku", "akkus", "empfängerakku", "empfängerakkus", "empfaengerakkus", "senderakku", "ladegerät", "ladegeraet", "ladegeräte", "ladetechnik", "netzteil", "netzteile", "akkuweiche", "akkuweichen", "batterie", "batterien", "chargeur", "chargeurs", "alimentation", "alimentations", "piles", "batería", "baterías", "bateria", "baterias", "cargador", "cargadores", "caricabatterie", "caricatore", "caricatori", "alimentatore", "alimentatori", "carregador", "carregadores", "pilas"}},
	{"gereedschap", []string{"gereedschap", "tools", "schroevendraaier", "inbussleutel", "steeksleutel", "tang", "werkstandaard", "car stand", "pitmat", "lijm", "klebstoffe", "epoxy", "soldeer", "verf", "paint", "lacquer", "primer", "spuitbus", "spray", "airbrush", "werkzeug", "werkzeuge", "werkstattzubehör", "werkstattzubehoer", "kleber", "klebstoff", "sekundenkleber", "farbe", "farben", "lötzinn", "lötkolben", "outil", "outils", "outillage", "tournevis", "colle", "colles", "peinture", "peintures", "graisse", "graisses", "huiles", "pince", "pinces", "fer à souder", "adhésifs", "glue", "glues", "grease", "herramienta", "herramientas", "pegamento", "pegamentos", "adhesivos", "pintura", "pinturas", "attrezzi", "attrezzatura", "utensili", "vernice", "vernici", "ferramenta", "ferramentas", "tinta", "tintas", "chave", "chaves", "óleo", "óleos", "oleo", "oleos", "aceite", "aceites", "olio", "lubrificantes", "lubricantes", "broca", "brocas", "machos de roscar", "roscado"}},
	{"elektronica", []string{"elektronica", "electronica", "electronics", "flybarless systems", "servo", "servos", "servo's", "regelaar", "regelaars", "esc", "snelheidsregelaar", "snelheidsregelaars", "speed controller", "speed controllers", "brushless motor", "borstelmotor", "motoren", "motor", "gyro", "flight controller", "vliegcontroller", "fpv camera", "vtx", "verlichting", "led", "koelventilator", "koelventilatoren", "sound module", "geluidsmodule", "bec", "sensor", "elektronik", "regler", "fahrtregler", "drehzahlregler", "elektromotor", "elektromotoren", "außenläufer", "aussenlaeufer", "innenläufer", "innenlaeufer", "kreisel", "beleuchtung", "schalter", "aussenläufer", "outrunner", "inrunner", "elektroantriebe", "lichter", "électronique", "electronique", "variateur", "variateurs", "moteurs", "moteur", "éclairage", "eclairage", "gyroscope", "contrôleur de vol", "contrôleurs de vol", "caméras fpv", "caméra fpv", "interrupteurs", "contrôleur", "controleur", "contrôleurs", "controleurs", "electrónica", "elettronica", "eletrónica", "eletrônica", "variador", "variadores", "regulador", "reguladores", "regolatore", "regolatori", "motores", "motori", "giroscopio", "iluminación", "luces", "luci", "luzes", "connector", "connectors", "conector", "conectores", "cabos", "cables", "fichas", "servi", "gimbal", "cavo", "cavi", "ubec"}},
	{"onderdelen", []string{"onderdelen", "onderdeel", "parts", "spare", "spare parts", "repuestos", "toebehoren", "accessoires", "accessories", "blades", "main blades", "tail blades", "paddles", "canopy", "canopies", "upgrade", "upgrades", "banden", "velgen", "wielen", "tires", "tyres", "wheels", "kogellager", "kogellagers", "lagers", "bearing", "tandwiel", "pinion", "pinions", "spur", "spurs", "turnbuckle", "turnbuckles", "aandrijfas", "driveshaft", "draagarm", "schokdemper", "schokdempers", "shocks", "karrosserie", "carrosserie", "body", "bodies", "bodyshell", "chassis onderdelen", "schroeven", "schroevenset", "hardware", "decals", "decal sheet", "propeller", "propellers", "rotorblad", "rotorbladen", "differentieel", "hop-up", "hop up", "tandwielen", "aandrijving", "ersatzteil", "ersatzteile", "tuningteile", "teile", "reifen", "felgen", "räder", "raeder", "kugellager", "zahnrad", "zahnräder", "ritzel", "hauptzahnrad", "luftschraube", "luftschrauben", "klappluftschraube", "klappluftschrauben", "starrluftschrauben", "karosserie", "stoßdämpfer", "dämpfer", "daempfer", "schrauben", "querlenker", "antriebswelle", "rotorblätter", "servohebel", "gestänge", "spinner", "fahrwerk", "einziehfahrwerk", "einziehfahrwerke", "servoersatzteile", "pièce", "pièces", "piece", "pieces", "pièces détachées", "pneu", "pneus", "jantes", "roues", "roulement", "roulements", "pignon", "pignons", "couronne", "couronnes", "carrosseries", "amortisseur", "amortisseurs", "vis", "visserie", "écrous", "ecrous", "hélice", "hélices", "helices", "pales", "cardan", "cardans", "palonniers", "cônes", "options", "triangle", "triangles", "fusée", "fusées", "embrayage", "aileron", "ailerons", "platine", "renfort", "renforts", "biellette", "biellettes", "engrenage", "engrenages", "bague", "bagues", "rondelles", "entretoises", "axe", "axes", "étrier", "étriers", "réservoir", "filtre", "durite", "différentiel", "differentiel", "diff", "choc", "chocs", "roulis", "rotule", "rotules", "ressort", "ressorts", "carter", "noix", "fusee", "chape", "chapes", "guignol", "guignols", "grappe", "pont", "suspension", "slipper", "shock", "brace", "transmission", "recambio", "recambios", "repuesto", "accesorio", "accesorios", "ricambio", "ricambi", "accessori", "peça", "peças", "pecas", "acessórios", "acessorios", "neumáticos", "neumaticos", "ruedas", "llantas", "rodamientos", "piñón", "piñones", "coronas", "amortiguador", "amortiguadores", "carrocería", "carrocerías", "carroceria", "carrocerias", "tornillos", "tornillería", "palas", "gomme", "pneumatici", "ruote", "cerchi", "cuscinetti", "pignone", "pignoni", "ammortizzatore", "ammortizzatori", "carrozzeria", "carrozzerie", "viti", "elica", "eliche", "rodas", "rolamentos", "pinhão", "pinhões", "amortecedores", "carroçaria", "carroçarias", "parafusos", "diferencial", "differenziale", "bujía", "bujías", "bujias", "escape", "escapes", "depósito", "depósitos", "filtro", "filtros", "embraiagem", "embraiagens", "embrague", "embragues", "frizione", "maxilas", "velas", "arranque", "arranques", "glow plug", "glow plugs", "bulkhead", "bumper", "shaft", "shafts", "hub", "hubs", "hub carrier", "hub carriers", "steering block", "steering blocks", "ball end", "ball ends", "king pin", "e-clips", "c-rings", "eixo", "eixos", "rótula", "rótulas", "braço", "braços", "trapecio", "trapecios", "bracci", "braccetto", "braccetti", "chasis", "transmision", "transmisión", "direccion", "dirección", "estructurales", "clutch", "arm", "arms", "gear", "gears", "spring", "springs", "damper", "dampers", "dampener", "joint", "belt", "bushing", "bushings", "washer", "washers", "screw", "screws", "cardanes", "piezas", "pegatinas", "stickers", "cover", "covers", "flybar", "landing gear", "film entelar", "entelado", "asse", "cono", "conos", "tuercas", "cabina", "autoscale", "autoescala", "ingranaggi", "ingranaggio", "molla", "molle", "adesivi", "pale principali", "pale rotore", "coppia pale", "pale coda", "corone", "mozzo", "mozzi", "alberino", "portafusello", "carrello", "ingranaggeria", "lexan", "supporto", "arandela", "arandelas", "öl", "öle", "oel", "dämpferöl", "daempferoel", "differentialöl", "silikonöl", "silicone fluid", "silicone oil", "shock oil", "diff oil", "fett", "schmierstoffe", "beschlagteile", "beschläge", "schiffspropeller", "schiffsschrauben", "schiffsantriebe", "wellenantrieb", "wellenantriebe", "wellenanlage", "stevenrohr", "stevenrohre", "kupplung", "kupplungen", "zahnriemen", "reling", "ruderanlage", "ruderanlagen", "anlenkungen", "kortdüse", "kortduesen", "querstromruder", "werkstoffe", "halbzeug", "halbzeuge", "materialien", "profile", "sperrholz", "messing", "hydraulik", "hydraulikzylinder", "pumpen"}},
	{"drones", []string{"drone", "drones", "quadcopter", "multicopter", "fpv", "multikopter", "multicopter", "kopter", "dron", "droni"}},
	{"helicopters", []string{"helicopter", "helicopters", "helikopter", "heli", "heli's", "hubschrauber", "hélicoptère", "hélicoptères", "helicoptere", "helicopteres", "hélico", "hélicos", "helicóptero", "helicópteros", "helicoptero", "helicopteros", "elicottero", "elicotteri"}},
	{"vliegtuigen", []string{"vliegtuig", "vliegtuigen", "airplane", "airplanes", "plane", "planes", "zweefvliegtuig", "zwever", "zwevers", "jet", "edf", "warbird", "trainer", "glider", "pnp", "bnf", "arf", "flugzeug", "flugzeuge", "modellflugzeug", "modellflugzeuge", "segler", "segelflugzeug", "segelflugzeuge", "impeller", "flugmodell", "flugmodelle", "freiflugmodelle", "motorflugzeug", "avion", "avions", "planeur", "planeurs", "aile volante", "ailes volantes", "autogyre", "avión", "aviones", "avião", "aviões", "aviao", "avioes", "aereo", "aerei", "aeromodelo", "aeromodelos", "aeromodello", "aeromodelli", "aeromodelismo", "planeador", "planeadores", "planador", "planadores", "aliante", "alianti"}},
	{"boten", []string{"boot", "boten", "boat", "boats", "scheepsmodel", "scheepsmodellen", "speedboot", "zeilboot", "schip", "schepen", "jacht", "sleepboot", "duikboot", "onderzeeboot", "boote", "schiff", "schiffe", "schiffsmodell", "schiffsmodelle", "rennboot", "bateau", "bateaux", "voilier", "voiliers", "hors bord", "barco", "barcos", "barca", "barche", "lancha", "lanchas", "motoscafo", "motoscafi", "veliero", "velieri"}},
	{"tanks", []string{"tank", "tanks", "panzer", "militair", "military", "leopard", "sherman", "tiger", "char", "chars", "blindé", "blindés", "tanque", "tanques", "carro de combate", "carros de combate", "carro armato", "carri armati", "blindados"}},
	{"werkvoertuigen", []string{"werkvoertuig", "werkvoertuigen", "trailer", "aanhanger", "container", "graafmachine", "graafmachines", "graver", "excavator", "bulldozer", "shovel", "wiellader", "loader", "kraan", "crane", "dumper", "kiepwagen", "kipper", "tractor", "tractors", "trekker", "oplegger", "opleggers", "bouwmachine", "bouwmachines", "landbouw", "dieplader", "tipper", "arocs", "vrachtwagen", "vrachtwagens", "trucks 1/14", "1/14 truck", "scania", "actros", "volvo fh", "man tgx", "brandweer", "hydrauliek", "hydraulisch", "lkw", "rc trucks", "r c trucks", "bagger", "radlader", "sattelzug", "auflieger", "anhänger", "traktor", "baumaschine", "baumaschinen", "camion", "camions", "remorque", "remorques", "pelleteuse", "pelleteuses", "tracteur", "tracteurs", "engin de chantier", "engins de chantier", "benne", "camión", "camiones", "camião", "camiões", "excavadora", "excavadoras", "escavadora", "escavadoras", "escavatore", "escavatori", "ruspa", "trattore", "trattori", "grúa", "grua", "gru", "remolque", "remolques", "rimorchio", "reboque", "cabeza tractora", "maquinaria"}},
	{"rc-autos", []string{"auto", "autos", "auto's", "rc auto", "car", "cars", "buggy", "buggy's", "buggies", "truggy", "crawler", "crawlers", "monster truck", "monster trucks", "monstertruck", "monstertrucks", "short course", "drift", "touring", "onroad", "on-road", "offroad", "off-road", "rally", "basher", "rock racer", "desert truck", "speed truck", "stadium truck", "fahrzeug", "fahrzeuge", "rennwagen", "geländewagen", "voiture", "voitures", "tout terrain", "coche", "coches", "carro", "carros", "automodelo", "automodelos", "automodelismo", "automodello", "automodelli", "todoterreno", "fuoristrada", "pista"}},
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
