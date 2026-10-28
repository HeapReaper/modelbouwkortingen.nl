/**
 * Nederlandse teksten: de bron voor de andere talen (zie en.ts en de.ts, die hetzelfde type
 * moeten hebben). Invulplekken staan als {naam}; zie t() en rich() in src/i18n/i18n.tsx.
 */
export const nl = {
  meta: {
    defaultTitle:
      "Modelbouwkortingen.nl — De beste RC-aanbiedingen op één plek",
    description:
      "Vind RC-auto's, vliegtuigen, helicopters, drones en onderdelen met korting bij TopRC, Toemen, Wetronic en meer. Dagelijks bijgewerkt.",
  },
  layout: {
    skipToContent: "Naar de inhoud",
    bannerBefore: "Alleen échte kortingen: minimaal",
    bannerHighlight: "€5 of 5%",
    bannerAfter: "goedkoper — dagelijks bijgewerkt",
    call: "Bel",
  },
  nav: {
    account: "Mijn account",
    homeLabel: "Modelbouwkortingen.nl home",
    deals: "Aanbiedingen",
    allDeals: "Alle aanbiedingen",
    compare: "Prijsvergelijker",
    partfinder: "Partfinder",
    categories: "Categorieën",
    shops: "Webshops",
    allShops: "Alle webshops bekijken →",
    contact: "Contact",
    search: "Zoeken",
    openMenu: "Menu openen",
    theme: "Kleurenthema kiezen",
    themeLight: "Licht",
    themeDark: "Donker",
    themeSystem: "Systeem",
    language: "Taal kiezen",
    watchlist: "Volglijst",
    brands: "Merken",
    allBrands: "Alle merken bekijken →",
  },
  search: {
    placeholder: "Zoek een deal…",
    placeholderLarge: "Zoek bijv. Arrma Kraton, LiPo 4S, Spektrum…",
    label: "Zoek naar aanbiedingen",
    button: "Zoeken",
  },
  footer: {
    newsletterTitle: "Dagelijkse kortingsmail",
    newsletterText: "Elke ochtend de grootste nieuwe RC-deals in je inbox.",
    about:
      "Wij speuren dagelijks de grote RC-webshops af en tonen alleen producten die écht afgeprijsd zijn: minstens €5 of 5% goedkoper.",
    categories: "Categorieën",
    shops: "Webshops",
    allShops: "Alle webshops",
    site: "Ontdek",
    allDeals: "Alle aanbiedingen",
    compare: "Prijsvergelijker",
    partfinder: "Partfinder",
    newsletter: "Dagelijkse kortingsmail",
    discord: "Deals in je Discord",
    howItWorks: "Hoe werkt het?",
    forShops: "Voor webshops",
    contact: "Contact",
    rights: "Alle rechten voorbehouden.",
    disclaimer:
      "Prijzen en voorraad kunnen afwijken. De prijs in de webshop is altijd leidend.",
    brands: "Merken",
    watchlist: "Volglijst",
    rss: "RSS-feed",
    followUs: "Volg ons",
    privacy: "Privacybeleid",
    cookieSettings: "Cookie-instellingen",
  },
  breadcrumb: { label: "Kruimelpad", home: "Home" },
  categories: {
    "rc-autos": {
      name: "RC Auto's",
      description: "Buggy's, monstertrucks, crawlers en drift cars",
    },
    vliegtuigen: {
      name: "Vliegtuigen",
      description: "Trainers, warbirds, jets en zweefvliegtuigen",
    },
    helicopters: {
      name: "Helicopters",
      description: "Van beginners-heli tot 3D-machine",
    },
    drones: { name: "Drones", description: "FPV, camera- en racedrones" },
    boten: { name: "Boten", description: "Speedboten, zeilboten en schepen" },
    werkvoertuigen: {
      name: "Werkvoertuigen",
      description: "Trucks, graafmachines, shovels en kranen",
    },
    tanks: {
      name: "Tanks & Militair",
      description: "RC tanks en militaire voertuigen",
    },
    zenders: {
      name: "Zenders & Ontvangers",
      description: "Zenders, ontvangers en telemetrie",
    },
    elektronica: {
      name: "Elektronica",
      description: "Servo's, regelaars, motoren en verlichting",
    },
    "accus-laders": {
      name: "Accu's & Laders",
      description: "LiPo, NiMH, laders en voedingen",
    },
    onderdelen: {
      name: "Onderdelen",
      description: "Banden, upgrades en reserveonderdelen",
    },
    gereedschap: {
      name: "Gereedschap",
      description: "Gereedschap, lijm, verf en werkplaats",
    },
    overig: { name: "Overig", description: "Alles wat nergens anders past" },
  } as Record<string, { name: string; description: string }>,
  shops: {
    toprc:
      "Grote RC-specialist met auto's, helicopters, vliegtuigen, boten en onderdelen.",
    toemen:
      "Modelsportwinkel in Oisterwijk met een enorm assortiment RC, occasions en onderdelen.",
    wetronic:
      "Modelbouwspecialist met veel vliegtuigen, zenders, elektronica en onderdelen.",
    minizshop:
      "Specialist in Kyosho Mini-Z en kleine RC-auto's, met veel onderdelen en Traxxas-parts.",
    berlinski:
      "Grote Duitse modelbouwwinkel met RC-auto's, trucks, boten, vliegtuigen en veel onderdelen.",
    hoellein:
      "Duitse modelvliegspecialist met motoren, regelaars, servo's, propellers en bouwmaterialen.",
    mgmodellbau:
      "Duitse modelbouwshop met veel zenders, ontvangers, elektronica en onderdelen.",
    hacker:
      "Duitse fabrikant van brushless motoren, met eigen webshop voor motoren, regelaars, accu's en modellen.",
    rcmotorsports:
      "RC-dealer in Nieuwerkerk aan den IJssel met o.a. Traxxas, Arrma, Axial en Tamiya, plus veel onderdelen.",
    droneshop:
      "Dronespecialist met camera-, FPV- en racedrones, plus accu's, propellers en onderdelen.",
    tamico:
      "Duitse RC-car-specialist met veel Tamiya, Kyosho en Traxxas, plus trucks, tanks en een enorm onderdelenassortiment.",
    chinahobbyline:
      "Webshop van accumerk CNHL met LiPo-, LiHV- en LiFe-accu's, laders en RC-modellen.",
    hepf: "Oostenrijkse modelvliegspecialist met vliegtuigen, zwevers, jets en turbines, plus heli's, RC-auto's en elektronica.",
    bliek:
      "Modelbouwwinkel in Breda met RC-auto's, trucks, vliegtuigen, helikopters en boten, plus onderdelen en verf.",
    aerobertics:
      "Belgische RC-specialist met een groot aanbod vliegtuigen, helikopters, auto's en boten, plus elektronica en aandrijvingen.",
    heligear:
      "Helikopterspecialist uit Breda met Mikado LOGO, Goblin, OMP en Tron, plus rotorbladen, elektronica en laders.",
    area51:
      "Spaanse helikopterspecialist met Align, SAB en BeastX, plus vliegtuigen, auto's, drones, accu's en Optifuel.",
    banggood:
      "Grote Chinese webwinkel met goedkope RC-auto's, werkvoertuigen, drones, helikopters, boten en vliegtuigen.",
    voltmaster:
      "Duitse RC-shop met vliegtuigen, zwevers, auto's en boten, plus veel accu's, laders, motoren, regelaars en servo's.",
    nfactory:
      "Duitse FPV-specialist met drones, frames, motoren, flight controllers, videobrillen, lipo's en propellers.",
    lindinger:
      "Grote Oostenrijkse modelbouwzaak met vliegtuigen, heli's, drones, auto's en boten, plus elektronica, accu's en onderdelen.",
    rccaronline:
      "Duitse specialist in grote 1:5- en 1:6-auto's van FG, Mecatech, Losi en HPI, met onderdelen, tuning en motoren.",
    premiummodellbau:
      "Duitse dronespecialist met multicopters, flight controllers, GPS, motoren, gimbals en videoverbindingen, plus robotica.",
    copterfarm:
      "Duitse FPV-shop met frames, motoren, regelaars, flight controllers, videobrillen, accu's en propellers.",
    shopzinnig:
      "Nederlandse modelbouwwinkel met veel onderdelen voor Blade-, E-sky- en Nine Eagles-heli's, plus drones, auto's, vliegtuigen en elektronica.",
    hobbyking:
      "Grote internationale RC-webshop met eigen merken als Turnigy, Durafly, H-King en Avios; wij volgen de prijzen van het EU-magazijn.",
    speelgoedenmodelbouw:
      "Nederlandse speelgoed- en modelbouwwinkel met veel Tamiya: RC-auto's, tanks, trucks en onderdelen, plus Carson en Kyosho.",
    theborder:
      "RC-winkel in Mijdrecht met een groot aanbod auto's en onderdelen van Traxxas, Kyosho, Axial, XRAY en meer, plus boten en accu's.",
    trxxs:
      "Belgische Traxxas-specialist in Lommel met ook Arrma, Losi, Axial en Pro Boat: auto's, boten, onderdelen en accu's.",
    erc: "Belgische helikopterspecialist met Goosky-heli's, rotorbladen, onderdelen, servo's, gyro's en laders.",
    rcnmore:
      "Belgische RC-winkel in Lendelede met veel onderdelen voor SAB-, Align-, Mikado- en Blade-heli's en Traxxas- en Tamiya-auto's.",
    rcteam:
      "Grote Franse RC-winkel in Firminy met Traxxas, Tamiya, Kyosho, HPI, Team Associated en Xray, plus onderdelen en gereedschap.",
    mrcmodelisme:
      "Franse modelbouwwinkel met veel Traxxas- en Kavan-onderdelen, plus auto's, vliegtuigen, boten, accu's en elektronica.",
    dronefpvracer:
      "Franse FPV-specialist met racedrones, frames, motoren, flight controllers, videobrillen, lipo's en propellers.",
    flashrc:
      "Grote Franse RC-winkel met vliegtuigen, helikopters, auto's, drones en boten, plus zenders, accu's, motoren en onderdelen.",
    originhobbies:
      "Finse helikopterspecialist met OMPHobby-, SAB-, Tron- en Flywing-heli's en veel onderdelen, plus Radiomaster-zenders, motoren en accu's.",
    stormrc:
      "Franse RC-winkel met Tamiya-, Kyosho- en Traxxas-auto's en onderdelen, plus accu's, banden en een paar vliegtuigen en boten.",
    speedlimitrc:
      "Spaanse modelvliegspecialist met FMS-, Freewing- en HSD-vliegtuigen, benzine- en turbinejets en veel onderdelen, plus servo's en elektronica.",
    rcypadel:
      "Spaanse RC-winkel met auto's, motoren, boten, drones, vliegtuigen en heli's, plus onderdelen, zenders, accu's en verbrandingsmotoren.",
    ttmodelismo:
      "Portugese RC-autowinkel met crawlers en scale-auto's, veel Injora-onderdelen, banden, carrosserieën, elektronica en accu's.",
    scalercbuzz:
      "Portugese crawlerspecialist met RC4WD-onderdelen, velgen, banden, scale-accessoires, elektronica en een paar complete auto's.",
    smartmodelismo:
      "Grote Portugese RC-winkel met auto's, crawlers, tanks, werkvoertuigen, vliegtuigen en boten, plus veel onderdelen, carrosserieën en elektronica.",
    rcstorealgarve:
      "Portugese RC-winkel in de Algarve met elektrische en nitro-auto's, crawlers, onderdelen, accu's en elektronica, plus veel verf en gereedschap.",
    myrcpitstop:
      "Cypriotische RC-winkel in Nicosia met veel Traxxas-onderdelen, plus Sworkz, Xray, Hudy, lagers, pinions, accu's en elektronica.",
    radiocontrolledshop:
      "Ierse RC-winkel in Dublin met veel onderdelen voor heli's (Align, Blade), drones (DJI) en auto's, plus accu's, laders, kabels en propellers.",
    helygo:
      "Italiaanse RC-winkel met auto's, crawlers, vliegtuigen en heli's, plus veel onderdelen, servo's, lipo's, zenders en gereedschap.",
    todohobby:
      "Spaanse hobbywinkel met RC-auto's, vliegtuigen, drones en boten, verbrandingsmotoren en turbines, plus onderdelen, accu's en gereedschap.",
    rcpro:
      "Grote Spaanse RC-autowinkel met Traxxas, Absima, Team Associated en Losi, plus veel onderdelen, banden, carrosserieën, elektronica en accu's.",
    tormodel:
      "Spaanse modelvliegwinkel met Dynam- en Volantex-vliegtuigen, heli-onderdelen, propellers, motoren, servo's, accu's en bouwbenodigdheden.",
    hobby351:
      "Portugese RC-autowinkel voor wedstrijdrijders met Mugen, Ruddog, banden, onderdelen, gereedschap en elektronica.",
    quartel:
      "Modelbouwwinkel in Pijnacker (sinds 1970) met RC-auto's, vliegtuigen, heli's en boten, plus onderdelen, brandstof, accu's en gereedschap.",
    monsterhopups:
      "Duitse RC-shop met vooral auto's en trucks van Traxxas, Arrma, Axial en Losi, plus veel onderdelen, tuning, elektronica, boten en vliegtuigen.",
    ghw:
      "Duitse modelbouwshop voor RC-graafmachines en hydrauliek, met materialen, schroeven, aandrijving, elektronica en gereedschap.",
    rcfox:
      "Grote Duitse RC-shop met auto's, trucks, vliegtuigen, heli's en boten, en heel veel onderdelen per merk, elektronica en gereedschap.",
    ruddog:
      "Duitse RC-importeur met vooral auto-onderdelen en tuning (Team Associated, Avid, Bittydesign), plus regelaars, motoren, accu's en gereedschap.",
    shamrock:
      "Modelbouwwinkel in Maastricht (sinds 1972) met RC-auto's en veel onderdelen (Traxxas, Tamiya, Kyosho, Arrma, HPI), plus vliegtuigen, boten, accu's en zenders.",
    bauer:
      "Duitse specialist in RC-schepen: bouwdozen, beslag, schroeven en asaandrijvingen, plus motoren, regelaars, verlichting en materialen.",
    rcraceshop:
      "RC-autoshop uit Berlijn met veel onderdelen en tuning per merk en model (Traxxas, GPM, Hobao, CEN, Corally), plus modellen en karosserieën.",
    dedition:
      "Duitse modelbouw- en speelgoedwinkel met RC-auto's, trucks, tanks, vliegtuigen en boten, en veel onderdelen per merk en model.",
    rckleinkram:
      "Duitse shop voor RC-auto-onderdelen en tuning, met veel kleine onderdelen, banden, karosserieën en gereedschap voor wedstrijdrijders.",
    jonathan:
      "Italiaanse RC-importeur en -winkel met vliegtuigen, heli's, auto's en boten van Horizon Hobby, Arrma en Phoenix Model, plus onderdelen en elektronica.",
  } as Record<string, string>,
  deals: {
    outOfStock: "Niet op voorraad",
    inStock: "Op voorraad",
    stockUnknown: "Voorraad onbekend",
    viewAt: "Bekijk {name} bij {shop}",
    toShop: "Naar de webshop",
    wasSr: "Was ",
    youSave: "Je bespaart {amount}",
    viewAll: "Bekijk alles",
    noneYet: "Nog geen deals gevonden. De crawler is op zoek — kom snel terug!",
    countOne: "1 deal",
    countOther: "{count} deals",
    foundOne: "deal gevonden",
    foundOther: "deals gevonden",
    forQuery: "voor",
    emptyTitle: "Geen deals gevonden",
    emptyText:
      "Probeer minder filters of een andere zoekterm. Er komen elke dag nieuwe aanbiedingen bij.",
    emptyCta: "Alle aanbiedingen bekijken",
    filters: "Filters",
    sort: "Sorteren",
    sortOptions: {
      korting: "Hoogste korting (%)",
      besparing: "Hoogste besparing (€)",
      nieuw: "Nieuwste deals",
      "prijs-laag": "Prijs laag → hoog",
      "prijs-hoog": "Prijs hoog → laag",
    },
    pagination: "Paginering",
    previous: "Vorige",
    next: "Volgende",
    noLongerDeal: "Nu geen aanbieding",
    lowestEver: "Laagste prijs ooit",
    lowest30: "Laagste prijs in 30 dagen",
  },
  filters: {
    category: "Categorie",
    allCategories: "Alle categorieën",
    shop: "Webshop",
    allShops: "Alle webshops",
    minDiscount: "Minimale korting",
    all: "Alles",
    price: "Prijs (€)",
    min: "Min",
    max: "Max",
    minLabel: "Minimale prijs",
    maxLabel: "Maximale prijs",
    to: "tot",
    inStock: "Alleen op voorraad",
    apply: "Filters toepassen",
    clear: "Alles wissen",
  },
  home: {
    badge: "Dagelijks nieuwe RC-deals",
    titleStart: "Meer RC.",
    titleHighlight: "Minder betalen.",
    intro:
      "De beste aanbiedingen voor RC-auto's, vliegtuigen, helicopters en drones. Verzameld bij jouw favoriete modelbouw-webshops — alleen échte kortingen van minstens €5 of 5%.",
    popular: "Populair:",
    statDealsOne: "1 deal",
    statProductsOne: "1 product gevolgd",
    statShopsOne: "1 webshop",
    statDeals: "{count} deals",
    statProducts: "{count} producten gevolgd",
    statShops: "{count} webshops",
    statMaxDiscount: "tot {percent}% korting",
    statUpdated: "bijgewerkt {ago}",
    featured: "Topdeal van dit moment",
    saveSr: "Bespaar {amount}",
    rcTitle: "RC-modellen",
    rcSubtitle:
      "Alleen complete modellen: auto's, vliegtuigen, helicopters, drones en boten",
    topTitle: "Grootste kortingen",
    topSubtitle: "De hoogste kortingspercentages van dit moment",
    newTitle: "Net binnen",
    newSubtitle: "Vers gespotte aanbiedingen",
    categoriesTitle: "Shop op categorie",
    categoriesSubtitle:
      "Kies waar je naar zoekt — wij tonen alleen afgeprijsde producten.",
    shopsTitle: "Webshops die wij in de gaten houden",
    shopDeals: "{count} deals bekijken",
    shopDealsFallback: "Deals bekijken",
    howTitle: "Hoe werkt Modelbouwkortingen?",
    howSteps: [
      {
        title: "Wij scannen de webshops",
        text: "Onze crawler bezoekt elke dag duizenden productpagina's van TopRC, Toemen, Wetronic en meer.",
      },
      {
        title: "Alleen échte kortingen",
        text: "Een product komt pas op de site als het minstens €5 of 5% goedkoper is dan de normale prijs.",
      },
      {
        title: "Jij bestelt direct bij de shop",
        text: "Klik door naar de webshop en bestel zoals altijd. Wij rekenen niets extra's.",
      },
    ],
  },
  dealsPage: {
    metaTitle: "Alle RC-aanbiedingen",
    metaDescription:
      "Alle RC-producten met minstens €5 of 5% korting, van alle webshops op één plek.",
    title: "Alle aanbiedingen",
    description:
      "Alle RC-producten die nu minstens €5 of 5% goedkoper zijn. Filter op categorie, webshop, korting of prijs.",
    crumb: "Aanbiedingen",
  },
  categoryPage: {
    metaTitle: "{name} met korting",
    metaDescription:
      "{name} in de aanbieding: {description} met minstens €5 of 5% korting.",
    title: "{name} in de aanbieding",
    description:
      "{description}. Alleen producten met minstens €5 of 5% korting.",
    others: "Andere categorieën",
  },
  shopsPage: {
    title: "Webshops",
    metaDescription:
      "Deze RC- en modelbouwwebshops houden wij dagelijks in de gaten.",
    description:
      "Deze modelbouw-webshops houden wij dagelijks in de gaten. Kies een webshop om al zijn aanbiedingen te zien.",
    allTitle: "Alle webshops",
    missing: "Mis je een webshop? Laat het ons weten via het {link}.",
    missingLink: "contactformulier",
  },
  promo: {
    sponsored: "Gesponsord",
    sponsoredInfo:
      "Betaalde plaatsing: de webshop betaalt om hier uitgelicht te worden. De prijzen en kortingen komen gewoon uit onze crawler.",
    dealsTitle: "Uitgelicht",
    dealsSubtitle: "Producten die webshops onder de aandacht brengen",
    shopsTitle: "Uitgelichte webshops",
    shopsSubtitle: "Webshops die we graag onder je aandacht brengen",
    visitShop: "Naar de webshop",
    viewDeals: "Bekijk aanbiedingen",
  },
  shopPage: {
    title: "{name} aanbiedingen",
    metaDescription:
      "Alle actuele aanbiedingen van {name} ({domain}) met minstens €5 of 5% korting.",
    visit: "Naar {domain}",
  },
  searchPage: {
    title: "Zoeken",
    metaDescription: "Zoek tussen alle RC-aanbiedingen.",
  },
  partfinderPage: {
    metaTitle: "Partfinder: zoek elk RC-onderdeel en model",
    metaDescription:
      "Doorzoek alle RC-modellen, onderdelen en artikelnummers van {count} webshops en zie waar het op voorraad of in de aanbieding is.",
    title: "Partfinder",
    description:
      "Zoek alles: complete modellen, onderdelen, upgrades of artikelnummers. Je ziet per product welke webshops het hebben en of het in de aanbieding is.",
    placeholder: "Bijv. Mini-T 2.0 tandwiel, LOS212018 of Losi Nascar",
    button: "Zoeken",
    searching: "Zoeken…",
    shop: "Webshop",
    allShops: "Alle webshops",
    inStock: "Alleen op voorraad",
    dealsOnly: "Alleen aanbiedingen",
    sort: "Sorteren",
    sorts: {
      relevantie: "Meest relevant",
      "prijs-laag": "Laagste prijs",
      "prijs-hoog": "Hoogste prijs",
      korting: "Hoogste korting",
      aanbod: "Meeste webshops",
    },
    intro:
      "Typ hierboven een model, onderdeel, merk of artikelnummer. We doorzoeken alle {count} webshops die we volgen, ook producten die niet in de aanbieding zijn.",
    resultsOne: "1 product gevonden voor {query}",
    resultsOther: "{count} producten gevonden voor {query}",
    dealsCount: "{count} in de aanbieding",
    foundAt: "Gevonden bij",
    truncated:
      "Er zijn meer treffers dan we in één keer doorzoeken. Maak je zoekopdracht specifieker of kies een categorie.",
    none: "Niets gevonden voor {query}. Probeer een andere schrijfwijze, minder woorden of alleen het artikelnummer.",
  },
  comparePage: {
    metaTitle: "Prijsvergelijker voor RC-producten",
    metaDescription:
      "Zoek een RC-product of artikelnummer en zie bij welke webshop het het goedkoopst is.",
    title: "Prijsvergelijker",
    description:
      "Zoek een product of artikelnummer en zie meteen bij welke webshop het het goedkoopst is.",
    placeholder: "Bijv. Traxxas TRX-4M, CNHL 5000mAh 4S of TRX3655",
    button: "Vergelijken",
    comparing: "Vergelijken…",
    inStock: "Alleen op voorraad",
    sort: "Sorteren",
    sortPrice: "Laagste prijs",
    sortOffers: "Meeste webshops",
    intro:
      "Typ hierboven een product, merk of artikelnummer. We zoeken in alle producten die we bij {count} webshops volgen, niet alleen in de aanbiedingen.",
    resultsOne: "1 product gevonden voor {query}",
    resultsOther: "{count} producten gevonden voor {query}",
    truncated:
      "Er zijn nog meer treffers. Maak je zoekopdracht specifieker voor een betere vergelijking.",
    none: "Niets gevonden voor {query}. Probeer een andere schrijfwijze of alleen het artikelnummer.",
    cheapestAt: "Goedkoopst bij {shop}",
    shopsOne: "1 webshop",
    shopsOther: "{count} webshops",
    sku: "Art.nr. {sku}",
    cheapest: "Goedkoopst",
    deal: "{percent}% korting",
    outOfStock: "Niet op voorraad",
    inStockLabel: "Op voorraad",
    toShop: "Naar shop",
    history: "Prijsverloop",
    disclaimer:
      "We koppelen producten op artikelnummer; controleer bij de webshop of het precies hetzelfde product is. Verzendkosten staan erbij als we ze kennen.",
    plusShipping: "+ {cost} verzending",
  },
  notFound: {
    title: "Oeps! Deze pagina bestaat niet.",
    text: "Misschien is de aanbieding verlopen of is de link veranderd. Zoek hieronder verder of bekijk alle deals.",
    cta: "Alle aanbiedingen bekijken",
  },
  product: {
    notFound: "Product niet gevonden",
    metaTitle: "{name} — {percent}% korting",
    metaDescription: "{name} nu voor {price} bij {shop}{save}.",
    metaSave: " (je bespaart {amount})",
    brand: "Merk: {brand}",
    referenceExplained:
      "De doorgestreepte prijs is de prijs die wij bij deze webshop zagen vóór de prijsdaling (de hoogste van de afgelopen 30 dagen).",
    viewAt: "Bekijk bij {shop}",
    outOfStock: "Niet op voorraad bij de webshop",
    inStock: "Op voorraad",
    stockUnknown: "Voorraad: kijk bij de webshop",
    dealSince: "In de aanbieding sinds {date} ({ago})",
    shopCategory: "Categorie bij webshop: {category}",
    originalName: "Originele naam: {name}",
    disclaimer:
      "Prijzen worden automatisch verzameld en kunnen inmiddels gewijzigd zijn. De prijs op de website van {shop} is altijd leidend.",
    history: "Prijsverloop",
    historyEmpty:
      "We volgen dit product nog niet lang genoeg voor een grafiek. Kom later terug!",
    related: "Meer {category} met korting",
    relatedFallback: "deals",
    chartPrice: "Prijs",
    noDeal: "Op dit moment geen aanbieding: dit is de gewone prijs.",
    claimHigher:
      "{shop} noemt {shopPercent}% korting (van {old}), maar volgens onze eigen prijshistorie is het {ourPercent}%.",
    claimMatches:
      "{shop} noemt zelf {shopPercent}% korting; dat klopt met wat wij zagen.",
    shopCountry: "Webshop uit {country}",
    shipping: "Verzending naar Nederland: {cost} (totaal {total})",
    shippingFree: "Gratis verzending naar Nederland",
    alternatives: "Ook verkrijgbaar bij",
    alternativesText:
      "Hetzelfde artikelnummer ({sku}) bij andere webshops, goedkoopste eerst. Controleer even of het precies hetzelfde product is.",
    thisOffer: "Dit aanbod",
  },
  about: {
    title: "Hoe werkt het?",
    metaDescription:
      "Zo vindt Modelbouwkortingen.nl de beste RC-aanbiedingen, en informatie voor webshops over onze crawler.",
    description:
      "Modelbouwkortingen.nl verzamelt automatisch RC-aanbiedingen van Nederlandse en Europese modelbouw-webshops, zodat jij niet overal hoeft te zoeken.",
    faqTitle: "Veelgestelde vragen",
    faq: [
      {
        q: "Wanneer staat een product op Modelbouwkortingen.nl?",
        a: "Wij houden de prijzen zelf bij. Een product verschijnt pas als de prijs minstens €5 óf 5% zakt ten opzichte van de prijs die wij eerder bij die webshop zagen (de hoogste van de afgelopen 30 dagen). Een 'van'-prijs die de webshop zelf toont tellen we niet mee. Het product blijft staan tot de prijs weer stijgt.",
      },
      {
        q: "Hoe vaak worden de prijzen bijgewerkt?",
        a: "Onze crawler draait de hele dag door. Populaire aanbiedingen worden meerdere keren per dag gecontroleerd, het volledige assortiment minstens een paar keer per week.",
      },
      {
        q: "Kost het mij iets?",
        a: "Nee. Je bestelt gewoon direct bij de webshop, tegen dezelfde prijs als altijd.",
      },
      {
        q: "De prijs in de webshop is anders dan hier. Hoe kan dat?",
        a: "Aanbiedingen kunnen snel veranderen. De prijs op de website van de webshop is altijd leidend. Zie je een fout? Laat het ons weten via het contactformulier.",
      },
      {
        q: "Mijn favoriete webshop staat er niet tussen.",
        a: "Laat het ons weten! We breiden het aantal webshops regelmatig uit.",
      },
    ],
    forShopsTitle: "Informatie voor webshops",
    crawlerIntro:
      "Onze crawler identificeert zich met de user-agent {userAgent} met een verwijzing naar deze pagina, en stuurt een {from}-header met ons contactadres.",
    crawlerRules: [
      "We respecteren robots.txt, ook bij redirects.",
      "We bezoeken per webshop maximaal enkele pagina's per seconde.",
      "Bij een HTTP 429 of 503 pauzeren we automatisch (5, 10, 20 seconden, …) en gaan we daarna rustiger verder.",
      "We lezen alleen publieke productinformatie: naam, prijs, afbeelding en categorie.",
      "Elke deal linkt direct naar de productpagina in jouw webshop.",
    ],
    crawlerContact:
      "Wil je dat we je webshop anders of niet meer crawlen, of wil je juist toegevoegd worden? Neem dan {contact} — we reageren snel. Je kunt ons ook blokkeren via robots.txt met {robots}.",
    crawlerContactLink: "contact met ons op",
  },
  contact: {
    title: "Contact",
    metaDescription:
      "Vraag, tip of opmerking? Neem contact op met Modelbouwkortingen.nl.",
    description:
      "Een vraag, een deal die niet klopt of een webshop die je mist? Laat het ons weten.",
    priceTitle: "Klopt een prijs niet?",
    priceText:
      "We verzamelen prijzen automatisch. Het kan dus gebeuren dat een aanbieding net verlopen is. Laat het ons weten, dan kijken we ernaar.",
    ownerTitle: "Webshop-eigenaar?",
    ownerText:
      'Wil je jouw webshop toevoegen, iets aanpassen of juist niet meer vermeld worden? Kies "{subject}" als onderwerp, dan regelen we het snel.',
    name: "Naam",
    email: "E-mailadres",
    subject: "Onderwerp",
    message: "Bericht",
    send: "Bericht versturen",
    sending: "Versturen…",
    sentTitle: "Bericht verstuurd",
    subjects: {
      general: "Algemene vraag",
      price: "Deal of prijs klopt niet",
      addShop: "Webshop toevoegen",
      owner: "Ik ben webshop-eigenaar",
      collaboration: "Samenwerking",
      other: "Anders",
    },
    errors: {
      name: "Vul je naam in.",
      email: "Vul een geldig e-mailadres in.",
      subject: "Kies een onderwerp.",
      messageShort: "Je bericht is wat kort (minimaal 10 tekens).",
      messageLong: "Je bericht is te lang (maximaal 5000 tekens).",
      rateLimited:
        "Je hebt al een paar berichten gestuurd. Probeer het later opnieuw.",
      failed: "Er ging iets mis bij het versturen. Probeer het later opnieuw.",
    },
    thanks: "Bedankt voor je bericht!",
    thanksReceived: "Bedankt! Je bericht is ontvangen.",
    thanksReply: "Bedankt! We reageren meestal binnen een paar dagen.",
  },
  newsletter: {
    metaTitle: "Dagelijkse kortingsmail",
    metaDescription:
      "Ontvang elke ochtend de grootste nieuwe RC-aanbiedingen van Nederlandse en Europese modelbouw-webshops in je mail.",
    title: "Dagelijkse kortingsmail",
    description:
      "Mis nooit meer een RC-deal: de grootste nieuwe aanbiedingen elke ochtend in je inbox.",
    crumb: "Kortingsmail",
    discordHint:
      "Heb je een Discord-server? Laat elke nieuwe deal direct in je kanaal posten via een {link}.",
    discordLink: "Discord-webhook",
    points: [
      {
        title: "Eén mail per dag",
        text: "Elke ochtend de hoogste nieuwe kortingen. Is er niets nieuws, dan sturen we niets.",
      },
      {
        title: "Alleen met jouw bevestiging",
        text: "Na het aanmelden krijg je een bevestigingsmail. Pas na jouw klik sturen we deals.",
      },
      {
        title: "Afmelden met één klik",
        text: "Onderaan elke mail staat een afmeldlink. We gebruiken je adres alleen voor deze mail.",
      },
    ],
    signupTitle: "Elke ochtend de grootste RC-kortingen in je mail",
    signupText:
      "Eén mail per dag met de hoogste nieuwe aanbiedingen. Geen spam, en afmelden kan altijd met één klik.",
    emailLabel: "E-mailadres",
    emailPlaceholder: "jouw@email.nl",
    submit: "Aanmelden",
    submitting: "Aanmelden…",
    subscribed:
      "Check je inbox en klik op de bevestigingslink. Ben je al aangemeld? Dan hoef je niets te doen.",
    invalidEmail: "Vul een geldig e-mailadres in.",
    rateLimited:
      "Je hebt je al een paar keer aangemeld. Probeer het later opnieuw.",
    failed: "Er ging iets mis bij het aanmelden. Probeer het later opnieuw.",
    confirmTitle: "Aanmelding bevestigen",
    confirmDescription:
      "Nog één klik en je ontvangt elke ochtend de grootste RC-kortingen.",
    confirmCrumb: "Bevestigen",
    confirmMissing:
      "Deze link is onvolledig. Open de link uit de bevestigingsmail opnieuw.",
    confirmButton: "Ja, stuur mij de dagelijkse deals",
    confirmPending: "Bevestigen…",
    confirmOk:
      "Je aanmelding is bevestigd. Morgenochtend krijg je de eerste deals!",
    confirmInvalid:
      "Deze link werkt niet (meer). Meld je opnieuw aan, dan sturen we een nieuwe.",
    unsubscribeTitle: "Afmelden voor de kortingsmail",
    unsubscribeMetaTitle: "Afmelden",
    unsubscribeDescription:
      "Jammer dat je gaat! Na het afmelden sturen we je geen kortingsmails meer.",
    unsubscribeCrumb: "Afmelden",
    unsubscribeMissing:
      "Deze link is onvolledig. Gebruik de afmeldlink onderaan een van onze mails.",
    unsubscribeButton: "Afmelden",
    unsubscribePending: "Afmelden…",
    unsubscribeOk: "Je bent afgemeld en krijgt geen kortingsmails meer.",
    unsubscribeInvalid: "Deze afmeldlink is onbekend.",
    preferencesHint:
      "Alleen deals uit bepaalde categorieën of webshops? Stel je {link} in.",
    preferencesLink: "voorkeuren",
  },
  discord: {
    metaTitle: "Deals in je Discord",
    metaDescription:
      "Koppel een Discord-webhook en krijg elke nieuwe RC-aanbieding direct als bericht in je eigen Discord-kanaal.",
    title: "Deals in je Discord",
    description:
      "Koppel een Discord-webhook en elke nieuwe RC-aanbieding verschijnt direct in je eigen kanaal.",
    crumb: "Discord",
    howTitle: "Zo maak je een webhook",
    steps: [
      "Open in Discord de instellingen van het kanaal waar de deals moeten komen.",
      "Ga naar Integraties → Webhooks → Nieuwe webhook.",
      "Geef hem eventueel een naam en klik op Webhook-URL kopiëren.",
      "Plak de URL in het veld en klik op Koppelen.",
    ],
    permission:
      'Je hebt daarvoor de rechten "Webhooks beheren" nodig in die server.',
    points: [
      {
        title: "Elke nieuwe deal",
        text: "Binnen een paar minuten nadat we een prijsdaling spotten, met prijs, korting en foto.",
      },
      {
        title: "Alleen in jouw kanaal",
        text: "De webhook kan alleen berichten plaatsen; we lezen niets en noemen niemand.",
      },
      {
        title: "Stoppen kan altijd",
        text: "Via de afmeldlink in het welkomstbericht, of verwijder de webhook in Discord.",
      },
    ],
    mailHint:
      "Liever één mail per dag met de hoogste kortingen? Meld je aan voor de {link}.",
    mailLink: "dagelijkse kortingsmail",
    urlLabel: "Webhook-URL",
    submit: "Koppelen",
    submitting: "Koppelen…",
    linked:
      "Gekoppeld! Er staat een welkomstbericht in je kanaal; nieuwe deals verschijnen daar vanzelf.",
    linkedNamed:
      'Gekoppeld aan "{name}"! Er staat een welkomstbericht in je kanaal; nieuwe deals verschijnen daar vanzelf.',
    rateLimited:
      "Je hebt al een paar webhooks opgegeven. Probeer het later opnieuw.",
    unavailable: "Discord-meldingen zijn nu niet beschikbaar.",
    failed: "Er ging iets mis bij het koppelen. Probeer het later opnieuw.",
    invalidUrl:
      "Dit is geen Discord-webhook-URL. Die begint met https://discord.com/api/webhooks/…",
    unknownWebhook:
      "Discord kent deze webhook niet. Controleer of je de hele URL hebt gekopieerd.",
    cannotPost:
      "We konden geen bericht in dit kanaal plaatsen. Probeer het later opnieuw.",
    unsubscribeTitle: "Discord-meldingen stoppen",
    unsubscribeDescription:
      "Na het afmelden posten we geen deals meer in dit kanaal. De webhook zelf kun je daarna in Discord verwijderen.",
    unsubscribeCrumb: "Afmelden",
    unsubscribeMissing:
      "Deze link is onvolledig. Gebruik de afmeldlink uit het welkomstbericht in je Discord-kanaal.",
    unsubscribeButton: "Meldingen stoppen",
    unsubscribePending: "Afmelden…",
    unsubscribeOk: "Afgemeld: we posten geen deals meer in dit kanaal.",
    unsubscribeInvalid: "Deze afmeldlink is onbekend of al gebruikt.",
    embedPrice: "Prijs",
    embedWas: "Was",
    embedDiscount: "Korting",
    embedAt: "Bij **{shop}**",
    embedHistory: "Prijsverloop",
    welcomeTitle: "Gekoppeld met Modelbouwkortingen.nl",
    welcomeText:
      "Vanaf nu verschijnt hier elke nieuwe RC-deal zodra we hem spotten.\n\nAlleen bepaalde categorieën of webshops? [Voorkeuren instellen]({prefs}).\n\nGeen meldingen meer? [Afmelden]({url}) of verwijder de webhook in Discord.",
  },
  mail: {
    confirmSubject: "Bevestig je aanmelding voor de dagelijkse RC-deals",
    confirmPreheader:
      "Nog één klik en je ontvangt elke dag de beste RC-kortingen.",
    confirmHeading: "Bijna klaar!",
    confirmText:
      "Bevestig je aanmelding, dan sturen we je elke ochtend de grootste nieuwe RC-kortingen van die dag.",
    confirmButton: "Aanmelding bevestigen",
    confirmFallback: "Werkt de knop niet? Kopieer deze link in je browser:",
    confirmFooter:
      "Heb je je niet aangemeld? Dan kun je deze mail negeren: zonder bevestiging sturen we je niets.",
    digestSubjectOne: "Tot {percent}% korting: 1 nieuwe RC-deal van vandaag",
    digestSubjectOther:
      "Tot {percent}% korting: {count} nieuwe RC-deals van vandaag",
    digestHeading: "De grootste nieuwe kortingen",
    digestIntro:
      "Sinds de vorige mail gespot bij de RC-webshops die we volgen.",
    digestCta: "Alle nieuwe deals bekijken",
    digestAllDeals: "Alle nieuwe deals",
    digestInsteadOf: "i.p.v.",
    digestFooter:
      "Je ontvangt deze mail omdat je je hebt aangemeld voor de dagelijkse deals van {site}. Prijzen en voorraad kunnen inmiddels gewijzigd zijn; de prijs in de webshop is leidend. Sommige links zijn affiliate-links.",
    unsubscribe: "Afmelden",
    preferences: "Voorkeuren aanpassen",
    alertConfirmSubject: "Bevestig je prijsalarm voor {name}",
    alertConfirmPreheader: "We mailen je zodra het {target} of minder kost.",
    alertConfirmHeading: "Bevestig je prijsalarm",
    alertConfirmText:
      "Je wilt een mail zodra {name} bij {shop} {target} of minder kost (nu {price}). Bevestig je alarm, dan houden we de prijs voor je in de gaten.",
    alertConfirmButton: "Prijsalarm bevestigen",
    alertConfirmFooter:
      "Heb je dit alarm niet aangevraagd? Dan kun je deze mail negeren: zonder bevestiging sturen we je niets.",
    alertCancel: "Alarm annuleren",
    alertSubject: "Prijsalarm: {name} nu {price}",
    alertHeading: "Je doelprijs is bereikt!",
    alertText: "{name} kost nu {price} bij {shop}. Je doelprijs was {target}.",
    alertCta: "Bekijk bij {shop}",
    alertHistory: "Prijsverloop bekijken",
    alertFooter:
      "Dit was een eenmalig prijsalarm van {site}; over dit product krijg je geen mail meer. Prijzen en voorraad kunnen inmiddels gewijzigd zijn; de prijs in de webshop is leidend. Sommige links zijn affiliate-links.",
    accountVerifySubject: "Bevestig je account bij Modelbouwkortingen.nl",
    accountVerifyPreheader: "Nog één klik en je account is klaar.",
    accountVerifyHeading: "Bevestig je e-mailadres",
    accountVerifyText:
      "Bedankt voor het aanmaken van een account. Bevestig je e-mailadres, dan ben je meteen ingelogd en kun je je volglijst, prijsalarmen en kortingsmail beheren.",
    accountVerifyButton: "E-mailadres bevestigen",
    accountVerifyFooter:
      "Heb je geen account aangemaakt? Dan kun je deze mail negeren: zonder bevestiging wordt het account niet actief. De link werkt 48 uur.",
    accountExistsSubject: "Je hebt al een account bij Modelbouwkortingen.nl",
    accountExistsHeading: "Je hebt al een account",
    accountExistsText:
      "Er is geprobeerd een account aan te maken met dit e-mailadres, maar dat heb je al. Log in op de site, of stel hieronder een nieuw wachtwoord in als je het vergeten bent.",
    passwordResetSubject: "Stel een nieuw wachtwoord in",
    passwordResetHeading: "Nieuw wachtwoord instellen",
    passwordResetText:
      "Je hebt gevraagd om een nieuw wachtwoord voor je account. Kies via de knop een nieuw wachtwoord; daarna ben je overal uitgelogd behalve op dat apparaat.",
    passwordResetButton: "Nieuw wachtwoord instellen",
    passwordResetFooter:
      "Heb je dit niet gevraagd? Dan kun je deze mail negeren; je wachtwoord blijft hetzelfde. De link werkt 1 uur.",
    emailChangeSubject: "Bevestig je nieuwe e-mailadres",
    emailChangePreheader: "Nog één klik en dit wordt het adres van je account.",
    emailChangeHeading: "Bevestig je nieuwe e-mailadres",
    emailChangeText:
      "Je wilt het e-mailadres van je account bij Modelbouwkortingen.nl wijzigen naar dit adres. Bevestig het, dan gaan je prijsalarmen en de kortingsmail voortaan hierheen.",
    emailChangeButton: "Nieuw adres bevestigen",
    emailChangeFooter:
      "Heb je dit niet gevraagd? Dan kun je deze mail negeren; er verandert niets. De link werkt 48 uur.",
    emailChangedSubject: "Het e-mailadres van je account is gewijzigd",
    emailChangedHeading: "Je e-mailadres is gewijzigd",
    emailChangedText:
      "Het e-mailadres van je account bij Modelbouwkortingen.nl is gewijzigd naar {email}. Mails over je account, prijsalarmen en de kortingsmail gaan voortaan naar dat adres.",
    emailChangedButton: "Contact opnemen",
    emailChangedFooter:
      "Heb jij dit gedaan? Dan hoef je niets te doen. Zo niet, neem dan direct contact met ons op.",
  },
  priceAlert: {
    createdAccount:
      "Je prijsalarm staat aan. We mailen je zodra je doelprijs bereikt is; je alarmen beheer je in je account.",
    privacyAccount:
      "Je bent ingelogd: met je accountadres staat het alarm meteen aan, zonder bevestigingsmail.",
    title: "Prijsalarm",
    text: "Nu {price}. Kies je doelprijs, dan mailen we je één keer zodra die bereikt is.",
    targetLabel: "Doelprijs (€)",
    emailLabel: "E-mailadres",
    submit: "Alarm instellen",
    submitting: "Instellen…",
    privacy:
      "Je krijgt eerst een bevestigingsmail. We gebruiken je adres alleen voor dit alarm.",
    created:
      "Check je inbox en bevestig je prijsalarm. Daarna houden we de prijs voor je in de gaten.",
    invalidEmail: "Vul een geldig e-mailadres in.",
    invalidPrice: "Vul een geldige doelprijs in.",
    targetTooHigh: "Kies een doelprijs onder de huidige prijs.",
    notFound: "Dit product bestaat niet (meer).",
    tooMany:
      "Je hebt al veel lopende prijsalarmen. Wacht tot er een afgaat of annuleer er een.",
    rateLimited:
      "Je hebt al een paar alarmen ingesteld. Probeer het later opnieuw.",
    failed: "Er ging iets mis. Probeer het later opnieuw.",
    unavailable: "Prijsalarmen zijn nu niet beschikbaar.",
    confirmTitle: "Prijsalarm bevestigen",
    confirmDescription:
      "Nog één klik en we houden de prijs voor je in de gaten.",
    confirmCrumb: "Prijsalarm bevestigen",
    confirmMissing:
      "Deze link is onvolledig. Open de link uit de bevestigingsmail opnieuw.",
    confirmButton: "Ja, houd de prijs voor mij in de gaten",
    confirmPending: "Bevestigen…",
    confirmOk:
      "Je prijsalarm staat aan. We mailen je zodra je doelprijs bereikt is.",
    confirmInvalid:
      "Deze link werkt niet (meer). Misschien is het alarm al afgegaan of geannuleerd.",
    cancelTitle: "Prijsalarm annuleren",
    cancelDescription:
      "Na het annuleren krijg je over dit product geen mail meer.",
    cancelCrumb: "Prijsalarm annuleren",
    cancelMissing:
      "Deze link is onvolledig. Gebruik de link uit de bevestigingsmail.",
    cancelButton: "Alarm annuleren",
    cancelPending: "Annuleren…",
    cancelOk: "Je prijsalarm is geannuleerd.",
    cancelInvalid: "Deze link is onbekend of het alarm is al geannuleerd.",
  },
  preferences: {
    crumb: "Voorkeuren",
    mailTitle: "Voorkeuren voor de kortingsmail",
    mailDescription:
      "Kies welke deals je in de dagelijkse mail wilt zien. Zijn er die dag geen nieuwe deals die passen, dan sturen we niets.",
    discordTitle: "Voorkeuren voor Discord",
    discordDescription: "Kies welke deals er in je Discord-kanaal verschijnen.",
    webhook: "Webhook: {name}",
    categories: "Categorieën",
    categoriesHint:
      "Vink aan wat je wilt zien. Niets of alles aangevinkt = alle categorieën, ook nieuwe.",
    shops: "Webshops",
    shopsHint:
      "Niets of alles aangevinkt = alle webshops. Liever korte levertijden? Kies dan alleen shops uit {countries}.",
    minDiscount: "Minimale korting",
    save: "Voorkeuren opslaan",
    saving: "Opslaan…",
    saved: "Opgeslagen! Je nieuwe voorkeuren gelden vanaf de volgende deal.",
    invalid:
      "Deze link is onbekend of je bent afgemeld. Gebruik de link uit je laatste mail of Discord-bericht.",
  },
  watchlist: {
    title: "Volglijst",
    description:
      "Producten die je met het hartje bewaart. Zonder account staat de lijst alleen in deze browser; met een account heb je hem op elk apparaat.",
    empty:
      "Je volglijst is nog leeg. Tik op het hartje bij een product om het hier te bewaren.",
    hint: "De prijzen zijn actueel. Wil je een mail als een prijs zakt? Stel dan een prijsalarm in op de productpagina.",
    save: "Volgen",
    saved: "Gevolgd",
    addLabel: "{name} op je volglijst zetten",
    removeLabel: "{name} van je volglijst halen",
  },
  account: {
    title: "Mijn account",
    description:
      "Je volglijst op elk apparaat, je prijsalarmen en de kortingsmail op één plek.",
    unavailable: "Accounts zijn nu niet beschikbaar.",
    failed: "Er ging iets mis. Probeer het later opnieuw.",
    rateLimited: "Te veel pogingen. Probeer het over een paar minuten opnieuw.",
    invalidEmail: "Vul een geldig e-mailadres in.",
    email: "E-mailadres",
    password: "Wachtwoord",
    password2: "Herhaal je wachtwoord",
    newPassword: "Nieuw wachtwoord",
    currentPassword: "Huidig wachtwoord",
    passwordHint:
      "Minstens {min} tekens. Een zin van een paar woorden is sterk en makkelijk te onthouden.",
    passwordTooShort: "Je wachtwoord moet minstens 10 tekens lang zijn.",
    passwordTooLong: "Je wachtwoord is te lang.",
    passwordMismatch: "De twee wachtwoorden zijn niet hetzelfde.",
    currentPasswordWrong: "Je wachtwoord klopt niet.",
    save: "Opslaan",
    saving: "Opslaan…",
    sending: "Versturen…",
    loginTitle: "Inloggen",
    login: "Inloggen",
    loggingIn: "Inloggen…",
    loginInvalid: "Dit e-mailadres en wachtwoord horen niet bij elkaar.",
    loginUnverified:
      "Je hebt je e-mailadres nog niet bevestigd. We hebben je (opnieuw) een bevestigingsmail gestuurd.",
    forgotLink: "Wachtwoord vergeten?",
    registerTitle: "Account aanmaken",
    registerPitch:
      "Gratis, en je hebt alleen een e-mailadres en wachtwoord nodig.",
    registerBenefits: [
      "Je volglijst op al je apparaten",
      "Al je prijsalarmen in één overzicht",
      "De kortingsmail aan- en uitzetten en je voorkeuren kiezen",
    ],
    registerCta: "Account aanmaken",
    register: "Account aanmaken",
    registering: "Aanmaken…",
    registerPrivacy:
      "Je krijgt een mail om je adres te bevestigen. We gebruiken je adres alleen voor je account; zie ons privacybeleid.",
    registered:
      "Check je inbox en klik op de link in de mail om je account te bevestigen. Heb je al een account met dit adres? Dan staat in de mail hoe je inlogt.",
    haveAccount: "Heb je al een account?",
    verifyTitle: "Account bevestigen",
    verifyDescription: "Nog één klik en je account is klaar.",
    verifyButton: "Ja, bevestig mijn account",
    verifying: "Bevestigen…",
    verifyInvalid:
      "Deze link werkt niet (meer). Log in om een nieuwe bevestigingsmail te krijgen.",
    linkIncomplete:
      "Deze link is onvolledig. Open de link uit de mail opnieuw.",
    forgotTitle: "Wachtwoord vergeten",
    forgotDescription:
      "Vul je e-mailadres in; we sturen je een link om een nieuw wachtwoord in te stellen.",
    forgotSubmit: "Stuur herstellink",
    resetSent:
      "Als er een account is met dit adres, staat er nu een mail met een herstellink in je inbox. De link werkt 1 uur.",
    resetTitle: "Nieuw wachtwoord",
    resetDescription:
      "Kies een nieuw wachtwoord. Daarna ben je op andere apparaten uitgelogd.",
    resetSubmit: "Wachtwoord opslaan",
    resetInvalid:
      "Deze link werkt niet (meer). Vraag een nieuwe herstellink aan.",
    welcome: "Je account is bevestigd en je bent ingelogd. Welkom!",
    deleted: "Je account en alle bijbehorende gegevens zijn verwijderd.",
    loggedInAs: "Ingelogd als",
    logout: "Uitloggen",
    watchlistTitle: "Volglijst",
    watchlistEmpty:
      "Je volglijst is nog leeg. Tik op het hartje bij een product om het te bewaren.",
    watchlistOne: "Er staat 1 product op je volglijst.",
    watchlistCount: "Er staan {count} producten op je volglijst.",
    watchlistOpen: "Volglijst bekijken",
    alertsTitle: "Prijsalarmen",
    alertsHint:
      "Alarmen stel je in op de productpagina. Hier pas je de doelprijs aan of annuleer je een alarm.",
    alertsEmpty: "Je hebt nog geen prijsalarmen.",
    alertNow: "nu {price}",
    alertTarget: "Doelprijs (€)",
    alertActive: "Actief",
    alertPending: "Wacht op bevestiging (opslaan zet hem aan)",
    alertTriggered: "Afgegaan: {price} op {date}",
    alertCancelled: "Geannuleerd",
    alertCancel: "Alarm voor {name} annuleren",
    alertSaved: "Opgeslagen.",
    alertInvalidPrice: "Vul een geldige doelprijs in.",
    newsletterTitle: "Kortingsmail",
    newsletterHint: "Elke ochtend de grootste nieuwe RC-kortingen in je inbox.",
    newsletterSwitch: "Stuur mij de dagelijkse kortingsmail",
    discordTitle: "Deals in Discord",
    discordHint:
      "Kies per Discord-webhook welke deals er in je kanaal verschijnen. Koppel je een webhook terwijl je bent ingelogd, dan staat hij hier.",
    discordEmpty:
      "Er is nog geen Discord-webhook aan je account gekoppeld. Plak hieronder een webhook-URL; een eerder gekoppelde webhook kun je ook opnieuw invoeren.",
    discordUnnamed: "Discord-webhook",
    discordStop: "Meldingen stoppen",
    discordAdd: "Nog een webhook koppelen",
    passwordTitle: "Wachtwoord wijzigen",
    changePassword: "Wachtwoord wijzigen",
    passwordChanged:
      "Je wachtwoord is gewijzigd. Op andere apparaten ben je uitgelogd.",
    emailTitle: "E-mailadres wijzigen",
    emailHint:
      "Je prijsalarmen en de kortingsmail verhuizen mee naar je nieuwe adres. Tot je het nieuwe adres bevestigt, blijft je huidige adres actief.",
    newEmail: "Nieuw e-mailadres",
    emailSubmit: "Bevestigingsmail sturen",
    emailSent:
      "We hebben een mail gestuurd naar {email}. Klik op de link in die mail om je nieuwe adres te bevestigen.",
    emailSame: "Dit is al je huidige e-mailadres.",
    emailConfirmTitle: "Nieuw e-mailadres bevestigen",
    emailConfirmDescription:
      "Nog één klik en dit wordt het e-mailadres van je account.",
    emailConfirmButton: "Ja, dit is mijn nieuwe adres",
    emailConfirming: "Bevestigen…",
    emailChangeInvalid:
      "Deze link werkt niet (meer). Vraag in je account een nieuwe bevestigingsmail aan.",
    emailTaken:
      "Er bestaat al een account met dit e-mailadres. Kies een ander adres of verwijder eerst dat account.",
    emailChanged:
      "Je e-mailadres is gewijzigd. Je prijsalarmen en de kortingsmail gaan voortaan naar het nieuwe adres.",
    deleteTitle: "Account verwijderen",
    deleteText:
      "Hiermee verwijder je je account, je volglijst, je prijsalarmen en je aanmelding voor de kortingsmail, en stop je de Discord-meldingen van je account. Dit kun je niet ongedaan maken.",
    deleteConfirmPassword: "Vul je wachtwoord in om te bevestigen",
    deleteSubmit: "Account definitief verwijderen",
    deleting: "Verwijderen…",
  },
  brandPage: {
    notFound: "Merk niet gevonden",
    metaTitle: "{name} aanbiedingen",
    metaDescription:
      "{count} producten van {name} met minstens €5 of 5% korting bij Nederlandse en Europese RC-webshops.",
    title: "{name} in de aanbieding",
    description:
      "Alle producten van {name} die nu minstens €5 of 5% goedkoper zijn, bij alle webshops die we volgen.",
    compare: "Vergelijk alle prijzen van {name} →",
  },
  brandsPage: {
    title: "Merken",
    metaDescription:
      "RC-merken met korting, van Traxxas en Arrma tot Spektrum en CNHL.",
    description:
      "Alle merken die nu in de aanbieding zijn. Kies een merk om al zijn deals te zien.",
    popular: "Populaire merken",
    all: "Alle merken van A tot Z",
  },
  privacy: {
    title: "Privacybeleid",
    metaDescription:
      "Welke gegevens Modelbouwkortingen.nl verwerkt, welke cookies we gebruiken en wat je rechten zijn.",
    description:
      "Welke gegevens we verwerken, waarom, hoe lang, en welke cookies er op deze site staan.",
    updated: "Laatst bijgewerkt: 19 oktober 2026",
    cookieSettings: "Cookie-instellingen wijzigen",
    contactText:
      "Vragen over je gegevens, of wil je inzage, correctie of verwijdering? Stuur ons een bericht via het {contact}.",
    contactLink: "contactformulier",
    sections: [
      {
        title: "Wie zijn wij",
        body: [
          "Modelbouwkortingen.nl verzamelt automatisch aanbiedingen van RC- en modelbouw-webshops. Wij zijn verantwoordelijk voor de verwerking van persoonsgegevens op deze website.",
        ],
      },
      {
        title: "Gewoon de site bekijken",
        body: [
          "Je kunt de site zonder account gebruiken. Om pagina's te tonen en misbruik te voorkomen (bijvoorbeeld een limiet op het contactformulier) verwerkt onze server technisch noodzakelijke gegevens zoals je IP-adres. We slaan je IP-adres niet op en koppelen het niet aan jou.",
          "Je volglijst en je keuze voor een licht of donker thema staan alleen in de opslag van je eigen browser. Op de volglijstpagina worden de product-id's meegestuurd om de producten te tonen; we bewaren ze niet.",
        ],
      },
      {
        title: "Kortingsmail en prijsalarm",
        body: [
          "Meld je je aan voor de dagelijkse kortingsmail of een prijsalarm, dan bewaren we je e-mailadres, de taal waarin je je aanmeldde, je voorkeuren (categorieën, webshops, minimale korting) of het product en de doelprijs van je alarm, en wanneer je je aanmeldde en bevestigde.",
          "We gebruiken dit alleen om je de gevraagde mails te sturen. De grondslag is je toestemming: je bevestigt je aanmelding via een link in je mailbox (double opt-in). In elke mail staat een link om je af te melden of je alarm te stoppen.",
        ],
      },
      {
        title: "Account",
        body: [
          "Maak je een account aan, dan bewaren we je e-mailadres, een versleutelde vorm (hash) van je wachtwoord, de taal waarin je je registreerde, wanneer je je account aanmaakte, bevestigde en voor het laatst inlogde, en de producten op je volglijst. Je prijsalarmen en kortingsmail horen bij hetzelfde e-mailadres en zie je in je account.",
          "We gebruiken dit alleen om je account te laten werken. De grondslag is de overeenkomst met jou: je kiest zelf voor een account. Je kunt je account op elk moment zelf verwijderen; dan wissen we het account, je volglijst, je prijsalarmen en je aanmelding voor de kortingsmail direct.",
        ],
      },
      {
        title: "Deals in Discord",
        body: [
          "Koppel je een Discord-webhook, dan bewaren we de webhook-URL, de naam die Discord bij de webhook teruggeeft, je taal en je voorkeuren, om nieuwe deals in jouw kanaal te plaatsen. Via de afmeldlink in het welkomstbericht stop je dat.",
        ],
      },
      {
        title: "Contactformulier",
        body: [
          "Stuur je ons een bericht, dan bewaren we je naam, e-mailadres, onderwerp en bericht om je vraag te beantwoorden.",
        ],
      },
      {
        title: "Bezoekersstatistieken",
        body: [
          "We tellen welke pagina's bekeken worden, met onze eigen statistieken en zonder cookies. Per weergave bewaren we de pagina, de taal, het type apparaat (mobiel, tablet of desktop) en, als je van een andere site komt, de naam van die site. Om bezoekers op één dag niet dubbel te tellen maken we van je IP-adres en browser een code met een sleutel die elke dag wordt vervangen en daarna gewist; je IP-adres zelf bewaren we niet en de code is na die dag niet meer naar jou te herleiden. Deze gegevens bewaren we ruim een jaar en delen we met niemand.",
        ],
      },
      {
        title: "Kliks naar webshops",
        body: [
          "Klik je door naar een webshop, dan tellen we die klik per product, webshop en bron (site, mail, Discord, …), zonder IP-adres of andere gegevens over jou. Sommige links bevatten een partnercode van de webshop. Bij de webshop geldt het privacybeleid van die webshop.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies",
        body: [
          "Functionele cookies en opslag, waarvoor geen toestemming nodig is: de cookie NEXT_LOCALE onthoudt je taalkeuze (1 jaar); als je inlogt, houdt de cookie mbk_sessie je ingelogd (30 dagen); je volglijst en thema staan in de opslag van je browser.",
          "Advertenties: we tonen advertenties via Google AdSense. Google en zijn partners kunnen daarvoor cookies plaatsen en gegevens over je bezoek gebruiken, bijvoorbeeld om advertenties af te stemmen op je interesses. In de Europese Economische Ruimte gebeurt dat alleen met je toestemming, die je geeft of weigert in de cookiemelding van Google. Je kunt je keuze altijd wijzigen met de knop hieronder of via 'Cookie-instellingen' onderaan elke pagina.",
        ],
        links: [
          {
            href: "https://policies.google.com/technologies/partner-sites?hl=nl",
            label:
              "Hoe Google gegevens gebruikt van sites die zijn diensten gebruiken",
          },
          {
            href: "https://myadcenter.google.com/?hl=nl",
            label: "Je advertentie-instellingen bij Google",
          },
        ],
      },
      {
        title: "Met wie we gegevens delen",
        body: [
          "We verkopen je gegevens nooit. Voor het versturen van mail gebruiken we een e-mailprovider, berichten in Discord gaan via Discord, en advertenties via Google. Zij verwerken gegevens alleen voor die taak. Productnamen van anderstalige webshops vertalen we op onze eigen server; daarvoor gaat niets naar een externe dienst.",
        ],
      },
      {
        title: "Hoe lang we gegevens bewaren",
        body: [
          "Je e-mailadres, webhook of contactbericht bewaren we zolang je de dienst gebruikt. Meld je je af of stop je een alarm, dan markeren we dat en sturen we niets meer. Wil je dat we je gegevens helemaal verwijderen, laat het ons weten, dan doen we dat.",
        ],
      },
      {
        title: "Je rechten",
        body: [
          "Je hebt het recht op inzage, correctie en verwijdering van je gegevens, en je kunt bezwaar maken of je toestemming intrekken. Ben je niet tevreden over hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens.",
        ],
        links: [
          {
            href: "https://autoriteitpersoonsgegevens.nl",
            label: "Autoriteit Persoonsgegevens",
          },
        ],
      },
      {
        title: "Wijzigingen",
        body: [
          "Verandert er iets aan hoe we met gegevens omgaan, dan passen we dit beleid aan. Bovenaan staat wanneer dat voor het laatst gebeurde.",
        ],
      },
    ],
  },
  feed: {
    title: "Nieuwe RC-aanbiedingen",
    titleFiltered: "{subject} met korting",
    description: "De nieuwste RC-producten met minstens €5 of 5% korting.",
    item: "{price} bij {shop} (was {was}, -{percent}%)",
    toShop: "Bekijk bij {shop}",
  },
  maintenance: {
    title: "We zijn even bezig met onderhoud",
    body: "Modelbouwkortingen.nl is tijdelijk niet beschikbaar. Probeer het straks opnieuw.",
  },
};

export type Dictionary = typeof nl;
