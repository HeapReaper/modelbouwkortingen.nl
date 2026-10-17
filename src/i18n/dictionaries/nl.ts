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
  },
  nav: {
    homeLabel: "Modelbouwkortingen.nl home",
    deals: "Aanbiedingen",
    allDeals: "Alle aanbiedingen",
    compare: "Prijsvergelijker",
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
    site: "Modelbouwkortingen",
    allDeals: "Alle aanbiedingen",
    compare: "Prijsvergelijker",
    newsletter: "Dagelijkse kortingsmail",
    discord: "Deals in je Discord",
    howItWorks: "Hoe werkt het?",
    forShops: "Voor webshops",
    contact: "Contact",
    rights: "Alle rechten voorbehouden.",
    disclaimer:
      "Prijzen en voorraad kunnen afwijken. De prijs in de webshop is altijd leidend.",
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
  } as Record<string, string>,
  deals: {
    outOfStock: "Niet op voorraad",
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
  comparePage: {
    metaTitle: "Prijsvergelijker voor RC-producten",
    metaDescription:
      "Zoek een RC-product of artikelnummer en zie bij welke webshop het het goedkoopst is.",
    title: "Prijsvergelijker",
    description:
      "Zoek een product of artikelnummer en zie meteen bij welke webshop het het goedkoopst is.",
    placeholder: "Bijv. Traxxas TRX-4M, CNHL 5000mAh 4S of TRX3655",
    button: "Vergelijken",
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
      "We koppelen producten op artikelnummer; controleer bij de webshop of het precies hetzelfde product is. Verzendkosten zijn niet meegerekend.",
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
    disclaimer:
      "Prijzen worden automatisch verzameld en kunnen inmiddels gewijzigd zijn. De prijs op de website van {shop} is altijd leidend.",
    history: "Prijsverloop",
    historyEmpty:
      "We volgen dit product nog niet lang genoeg voor een grafiek. Kom later terug!",
    related: "Meer {category} met korting",
    relatedFallback: "deals",
    chartPrice: "Prijs",
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
      "Vanaf nu verschijnt hier elke nieuwe RC-deal zodra we hem spotten.\n\nGeen meldingen meer? [Afmelden]({url}) of verwijder de webhook in Discord.",
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
  },
};

export type Dictionary = typeof nl;
