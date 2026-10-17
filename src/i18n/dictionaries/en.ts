import type { Dictionary } from "@/i18n/dictionaries/nl";

export const en: Dictionary = {
  meta: {
    defaultTitle: "Modelbouwkortingen.nl — The best RC deals in one place",
    description:
      "Find discounted RC cars, planes, helicopters, drones and parts from TopRC, Toemen, Wetronic and more. Updated daily.",
  },
  layout: {
    skipToContent: "Skip to content",
    bannerBefore: "Only real discounts: at least",
    bannerHighlight: "€5 or 5%",
    bannerAfter: "off — updated daily",
  },
  nav: {
    homeLabel: "Modelbouwkortingen.nl home",
    deals: "Deals",
    allDeals: "All deals",
    categories: "Categories",
    shops: "Shops",
    allShops: "View all shops →",
    contact: "Contact",
    search: "Search",
    openMenu: "Open menu",
    theme: "Choose colour theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    language: "Choose language",
  },
  search: {
    placeholder: "Search for a deal…",
    placeholderLarge: "Try Arrma Kraton, LiPo 4S, Spektrum…",
    label: "Search deals",
    button: "Search",
  },
  footer: {
    newsletterTitle: "Daily deals email",
    newsletterText: "The biggest new RC deals in your inbox every morning.",
    about:
      "Every day we scan the big RC shops and only show products that are genuinely reduced: at least €5 or 5% cheaper.",
    categories: "Categories",
    shops: "Shops",
    allShops: "All shops",
    site: "Modelbouwkortingen",
    allDeals: "All deals",
    newsletter: "Daily deals email",
    discord: "Deals in your Discord",
    howItWorks: "How does it work?",
    forShops: "For shops",
    contact: "Contact",
    rights: "All rights reserved.",
    disclaimer:
      "Prices and stock may differ. The price in the shop always applies.",
  },
  breadcrumb: { label: "Breadcrumb", home: "Home" },
  categories: {
    "rc-autos": {
      name: "RC Cars",
      description: "Buggies, monster trucks, crawlers and drift cars",
    },
    vliegtuigen: {
      name: "Planes",
      description: "Trainers, warbirds, jets and gliders",
    },
    helicopters: {
      name: "Helicopters",
      description: "From beginner helis to 3D machines",
    },
    drones: { name: "Drones", description: "FPV, camera and racing drones" },
    boten: { name: "Boats", description: "Speedboats, sailboats and ships" },
    werkvoertuigen: {
      name: "Construction & Trucks",
      description: "Trucks, excavators, loaders and cranes",
    },
    tanks: {
      name: "Tanks & Military",
      description: "RC tanks and military vehicles",
    },
    zenders: {
      name: "Transmitters & Receivers",
      description: "Transmitters, receivers and telemetry",
    },
    elektronica: {
      name: "Electronics",
      description: "Servos, ESCs, motors and lighting",
    },
    "accus-laders": {
      name: "Batteries & Chargers",
      description: "LiPo, NiMH, chargers and power supplies",
    },
    onderdelen: {
      name: "Parts",
      description: "Tyres, upgrades and spare parts",
    },
    gereedschap: {
      name: "Tools",
      description: "Tools, glue, paint and workshop",
    },
    overig: { name: "Other", description: "Everything that fits nowhere else" },
  },
  shops: {
    toprc:
      "Large RC specialist with cars, helicopters, planes, boats and parts.",
    toemen:
      "Model sport shop in Oisterwijk (NL) with a huge range of RC, second-hand models and parts.",
    wetronic:
      "Model specialist with lots of planes, transmitters, electronics and parts.",
    minizshop:
      "Specialist in Kyosho Mini-Z and small RC cars, with lots of parts and Traxxas spares.",
    berlinski:
      "Large German model shop with RC cars, trucks, boats, planes and lots of parts.",
    hoellein:
      "German model flying specialist with motors, ESCs, servos, propellers and building materials.",
    mgmodellbau:
      "German model shop with lots of transmitters, receivers, electronics and parts.",
    hacker:
      "German maker of brushless motors, with its own shop for motors, ESCs, batteries and models.",
    rcmotorsports:
      "RC dealer in Nieuwerkerk aan den IJssel (NL) with Traxxas, Arrma, Axial, Tamiya and lots of parts.",
    droneshop:
      "Drone specialist with camera, FPV and racing drones, plus batteries, propellers and parts.",
    tamico:
      "German RC car specialist with lots of Tamiya, Kyosho and Traxxas, plus trucks, tanks and a huge range of parts.",
    chinahobbyline:
      "Shop of battery brand CNHL with LiPo, LiHV and LiFe batteries, chargers and RC models.",
    hepf: "Austrian model flying specialist with planes, gliders, jets and turbines, plus helis, RC cars and electronics.",
    bliek:
      "Model shop in Breda (NL) with RC cars, trucks, planes, helicopters and boats, plus parts and paint.",
    aerobertics:
      "Belgian RC specialist with a large range of planes, helicopters, cars and boats, plus electronics and power systems.",
    heligear:
      "Helicopter specialist from Breda (NL) with Mikado LOGO, Goblin, OMP and Tron, plus rotor blades, electronics and chargers.",
    area51:
      "Spanish helicopter specialist with Align, SAB and BeastX, plus planes, cars, drones, batteries and Optifuel.",
  },
  deals: {
    outOfStock: "Out of stock",
    viewAt: "View {name} at {shop}",
    toShop: "Go to shop",
    wasSr: "Was ",
    youSave: "You save {amount}",
    viewAll: "View all",
    noneYet:
      "No deals found yet. The crawler is on the hunt — check back soon!",
    countOne: "1 deal",
    countOther: "{count} deals",
    foundOne: "deal found",
    foundOther: "deals found",
    forQuery: "for",
    emptyTitle: "No deals found",
    emptyText:
      "Try fewer filters or a different search term. New deals are added every day.",
    emptyCta: "View all deals",
    filters: "Filters",
    sort: "Sort",
    sortOptions: {
      korting: "Highest discount (%)",
      besparing: "Biggest saving (€)",
      nieuw: "Newest deals",
      "prijs-laag": "Price low → high",
      "prijs-hoog": "Price high → low",
    },
    pagination: "Pagination",
    previous: "Previous",
    next: "Next",
  },
  filters: {
    category: "Category",
    allCategories: "All categories",
    shop: "Shop",
    allShops: "All shops",
    minDiscount: "Minimum discount",
    all: "All",
    price: "Price (€)",
    min: "Min",
    max: "Max",
    minLabel: "Minimum price",
    maxLabel: "Maximum price",
    to: "to",
    inStock: "In stock only",
    apply: "Apply filters",
    clear: "Clear all",
  },
  home: {
    badge: "New RC deals every day",
    titleStart: "More RC.",
    titleHighlight: "Pay less.",
    intro:
      "The best deals on RC cars, planes, helicopters and drones. Collected from your favourite model shops — only real discounts of at least €5 or 5%.",
    popular: "Popular:",
    statDealsOne: "1 deal",
    statProductsOne: "1 product tracked",
    statShopsOne: "1 shop",
    statDeals: "{count} deals",
    statProducts: "{count} products tracked",
    statShops: "{count} shops",
    statMaxDiscount: "up to {percent}% off",
    statUpdated: "updated {ago}",
    featured: "Top deal right now",
    saveSr: "Save {amount}",
    topTitle: "Biggest discounts",
    topSubtitle: "The highest discount percentages right now",
    newTitle: "Just in",
    newSubtitle: "Freshly spotted deals",
    categoriesTitle: "Shop by category",
    categoriesSubtitle:
      "Pick what you're looking for — we only show reduced products.",
    shopsTitle: "Shops we keep an eye on",
    shopDeals: "View {count} deals",
    shopDealsFallback: "View deals",
    howTitle: "How does Modelbouwkortingen work?",
    howSteps: [
      {
        title: "We scan the shops",
        text: "Every day our crawler visits thousands of product pages at TopRC, Toemen, Wetronic and more.",
      },
      {
        title: "Only real discounts",
        text: "A product only appears once it is at least €5 or 5% cheaper than its normal price.",
      },
      {
        title: "You order directly from the shop",
        text: "Click through to the shop and order as usual. We don't charge anything extra.",
      },
    ],
  },
  dealsPage: {
    metaTitle: "All RC deals",
    metaDescription:
      "All RC products with at least €5 or 5% off, from every shop in one place.",
    title: "All deals",
    description:
      "All RC products that are currently at least €5 or 5% cheaper. Filter by category, shop, discount or price.",
    crumb: "Deals",
  },
  categoryPage: {
    metaTitle: "{name} on sale",
    metaDescription:
      "{name} on sale: {description} with at least €5 or 5% off.",
    title: "{name} on sale",
    description: "{description}. Only products with at least €5 or 5% off.",
    others: "Other categories",
  },
  shopsPage: {
    title: "Shops",
    metaDescription: "These RC and model shops are checked by us every day.",
    description:
      "We keep an eye on these model shops every day. Pick a shop to see all of its deals.",
    allTitle: "All shops",
    missing: "Missing a shop? Let us know via the {link}.",
    missingLink: "contact form",
  },
  shopPage: {
    title: "{name} deals",
    metaDescription:
      "All current deals from {name} ({domain}) with at least €5 or 5% off.",
    visit: "Go to {domain}",
  },
  searchPage: {
    title: "Search",
    metaDescription: "Search all RC deals.",
  },
  notFound: {
    title: "Oops! This page doesn't exist.",
    text: "The deal may have expired or the link may have changed. Search below or view all deals.",
    cta: "View all deals",
  },
  product: {
    notFound: "Product not found",
    metaTitle: "{name} — {percent}% off",
    metaDescription: "{name} now {price} at {shop}{save}.",
    metaSave: " (you save {amount})",
    brand: "Brand: {brand}",
    referenceExplained:
      "The crossed-out price is the price we saw at this shop before the price drop (the highest of the last 30 days).",
    viewAt: "View at {shop}",
    outOfStock: "Out of stock at the shop",
    inStock: "In stock",
    stockUnknown: "Stock: check the shop",
    dealSince: "On sale since {date} ({ago})",
    shopCategory: "Shop category: {category}",
    disclaimer:
      "Prices are collected automatically and may have changed since. The price on the {shop} website always applies.",
    history: "Price history",
    historyEmpty:
      "We haven't tracked this product long enough for a chart yet. Check back later!",
    related: "More {category} on sale",
    relatedFallback: "deals",
    chartPrice: "Price",
  },
  about: {
    title: "How does it work?",
    metaDescription:
      "How Modelbouwkortingen.nl finds the best RC deals, plus information for shops about our crawler.",
    description:
      "Modelbouwkortingen.nl automatically collects RC deals from Dutch and other European model shops, so you don't have to search everywhere.",
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "When does a product appear on Modelbouwkortingen.nl?",
        a: "We track prices ourselves. A product only appears once its price drops by at least €5 or 5% compared with the price we saw at that shop before (the highest of the last 30 days). A 'was' price shown by the shop itself doesn't count. The product stays listed until the price goes up again.",
      },
      {
        q: "How often are prices updated?",
        a: "Our crawler runs all day. Popular deals are checked several times a day, the full range at least a few times a week.",
      },
      {
        q: "Does it cost me anything?",
        a: "No. You simply order directly from the shop, at the same price as always.",
      },
      {
        q: "The price in the shop is different from here. How come?",
        a: "Deals can change quickly. The price on the shop's website always applies. Spotted a mistake? Let us know via the contact form.",
      },
      {
        q: "My favourite shop isn't listed.",
        a: "Let us know! We regularly add more shops.",
      },
    ],
    forShopsTitle: "Information for shops",
    crawlerIntro:
      "Our crawler identifies itself with the user agent {userAgent} including a link to this page, and sends a {from} header with our contact address.",
    crawlerRules: [
      "We respect robots.txt, including after redirects.",
      "We visit at most a few pages per second per shop.",
      "On an HTTP 429 or 503 we pause automatically (5, 10, 20 seconds, …) and then continue more slowly.",
      "We only read public product information: name, price, image and category.",
      "Every deal links directly to the product page in your shop.",
    ],
    crawlerContact:
      "Would you like us to crawl your shop differently or not at all, or would you like to be added? Please {contact} — we respond quickly. You can also block us in robots.txt with {robots}.",
    crawlerContactLink: "get in touch",
  },
  contact: {
    title: "Contact",
    metaDescription:
      "Question, tip or remark? Get in touch with Modelbouwkortingen.nl.",
    description:
      "A question, a deal that isn't right or a shop you're missing? Let us know.",
    priceTitle: "Price not right?",
    priceText:
      "We collect prices automatically, so a deal may have just expired. Let us know and we'll take a look.",
    ownerTitle: "Shop owner?",
    ownerText:
      'Would you like to add your shop, change something or no longer be listed? Choose "{subject}" as the subject and we\'ll sort it out quickly.',
    name: "Name",
    email: "Email address",
    subject: "Subject",
    message: "Message",
    send: "Send message",
    sending: "Sending…",
    sentTitle: "Message sent",
    subjects: {
      general: "General question",
      price: "Deal or price is wrong",
      addShop: "Add a shop",
      owner: "I own a shop",
      collaboration: "Partnership",
      other: "Other",
    },
    errors: {
      name: "Please enter your name.",
      email: "Please enter a valid email address.",
      subject: "Please choose a subject.",
      messageShort: "Your message is a bit short (at least 10 characters).",
      messageLong: "Your message is too long (at most 5000 characters).",
      rateLimited:
        "You've already sent a few messages. Please try again later.",
      failed: "Something went wrong while sending. Please try again later.",
    },
    thanks: "Thanks for your message!",
    thanksReceived: "Thanks! Your message has been received.",
    thanksReply: "Thanks! We usually reply within a few days.",
  },
  newsletter: {
    metaTitle: "Daily deals email",
    metaDescription:
      "Get the biggest new RC deals from Dutch and other European model shops in your inbox every morning.",
    title: "Daily deals email",
    description:
      "Never miss an RC deal again: the biggest new deals in your inbox every morning.",
    crumb: "Deals email",
    discordHint:
      "Got a Discord server? Have every new deal posted straight to your channel with a {link}.",
    discordLink: "Discord webhook",
    points: [
      {
        title: "One email a day",
        text: "The biggest new discounts every morning. If there's nothing new, we don't send anything.",
      },
      {
        title: "Only with your confirmation",
        text: "After signing up you'll get a confirmation email. We only send deals once you've clicked it.",
      },
      {
        title: "Unsubscribe with one click",
        text: "Every email has an unsubscribe link at the bottom. We only use your address for this email.",
      },
    ],
    signupTitle: "The biggest RC discounts in your inbox every morning",
    signupText:
      "One email a day with the best new deals. No spam, and you can unsubscribe with one click at any time.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    submit: "Sign up",
    submitting: "Signing up…",
    subscribed:
      "Check your inbox and click the confirmation link. Already signed up? Then there's nothing to do.",
    invalidEmail: "Please enter a valid email address.",
    rateLimited:
      "You've already signed up a few times. Please try again later.",
    failed: "Something went wrong while signing up. Please try again later.",
    confirmTitle: "Confirm your subscription",
    confirmDescription:
      "One more click and you'll get the biggest RC discounts every morning.",
    confirmCrumb: "Confirm",
    confirmMissing:
      "This link is incomplete. Please open the link from the confirmation email again.",
    confirmButton: "Yes, send me the daily deals",
    confirmPending: "Confirming…",
    confirmOk:
      "Your subscription is confirmed. You'll get your first deals tomorrow morning!",
    confirmInvalid:
      "This link no longer works. Sign up again and we'll send you a new one.",
    unsubscribeTitle: "Unsubscribe from the deals email",
    unsubscribeMetaTitle: "Unsubscribe",
    unsubscribeDescription:
      "Sorry to see you go! After unsubscribing we won't send you any more deals emails.",
    unsubscribeCrumb: "Unsubscribe",
    unsubscribeMissing:
      "This link is incomplete. Please use the unsubscribe link at the bottom of one of our emails.",
    unsubscribeButton: "Unsubscribe",
    unsubscribePending: "Unsubscribing…",
    unsubscribeOk:
      "You've been unsubscribed and won't get any more deals emails.",
    unsubscribeInvalid: "This unsubscribe link is unknown.",
  },
  discord: {
    metaTitle: "Deals in your Discord",
    metaDescription:
      "Connect a Discord webhook and get every new RC deal posted straight to your own Discord channel.",
    title: "Deals in your Discord",
    description:
      "Connect a Discord webhook and every new RC deal appears straight away in your own channel.",
    crumb: "Discord",
    howTitle: "How to create a webhook",
    steps: [
      "In Discord, open the settings of the channel where the deals should go.",
      "Go to Integrations → Webhooks → New Webhook.",
      "Optionally give it a name and click Copy Webhook URL.",
      "Paste the URL into the field and click Connect.",
    ],
    permission:
      'You need the "Manage Webhooks" permission on that server for this.',
    points: [
      {
        title: "Every new deal",
        text: "Within a few minutes of us spotting a price drop, with price, discount and photo.",
      },
      {
        title: "Only in your channel",
        text: "The webhook can only post messages; we don't read anything and don't mention anyone.",
      },
      {
        title: "Stop at any time",
        text: "Via the unsubscribe link in the welcome message, or by deleting the webhook in Discord.",
      },
    ],
    mailHint:
      "Rather get one email a day with the biggest discounts? Sign up for the {link}.",
    mailLink: "daily deals email",
    urlLabel: "Webhook URL",
    submit: "Connect",
    submitting: "Connecting…",
    linked:
      "Connected! There's a welcome message in your channel; new deals will appear there automatically.",
    linkedNamed:
      'Connected to "{name}"! There\'s a welcome message in your channel; new deals will appear there automatically.',
    rateLimited:
      "You've already submitted a few webhooks. Please try again later.",
    unavailable: "Discord notifications are currently unavailable.",
    failed: "Something went wrong while connecting. Please try again later.",
    invalidUrl:
      "This isn't a Discord webhook URL. It starts with https://discord.com/api/webhooks/…",
    unknownWebhook:
      "Discord doesn't know this webhook. Check that you copied the whole URL.",
    cannotPost:
      "We couldn't post a message in this channel. Please try again later.",
    unsubscribeTitle: "Stop Discord notifications",
    unsubscribeDescription:
      "After unsubscribing we won't post any more deals in this channel. You can then delete the webhook itself in Discord.",
    unsubscribeCrumb: "Unsubscribe",
    unsubscribeMissing:
      "This link is incomplete. Please use the unsubscribe link from the welcome message in your Discord channel.",
    unsubscribeButton: "Stop notifications",
    unsubscribePending: "Unsubscribing…",
    unsubscribeOk:
      "Unsubscribed: we won't post any more deals in this channel.",
    unsubscribeInvalid:
      "This unsubscribe link is unknown or has already been used.",
    embedPrice: "Price",
    embedWas: "Was",
    embedDiscount: "Discount",
    embedAt: "At **{shop}**",
    embedHistory: "Price history",
    welcomeTitle: "Connected to Modelbouwkortingen.nl",
    welcomeText:
      "From now on every new RC deal will appear here as soon as we spot it.\n\nNo more notifications? [Unsubscribe]({url}) or delete the webhook in Discord.",
  },
  mail: {
    confirmSubject: "Confirm your subscription to the daily RC deals",
    confirmPreheader:
      "One more click and you'll get the best RC discounts every day.",
    confirmHeading: "Almost done!",
    confirmText:
      "Confirm your subscription and we'll send you the biggest new RC discounts of the day every morning.",
    confirmButton: "Confirm subscription",
    confirmFallback: "Button not working? Copy this link into your browser:",
    confirmFooter:
      "Didn't sign up? Then you can ignore this email: without confirmation we won't send you anything.",
    digestSubjectOne: "Up to {percent}% off: 1 new RC deal today",
    digestSubjectOther: "Up to {percent}% off: {count} new RC deals today",
    digestHeading: "The biggest new discounts",
    digestIntro: "Spotted at the RC shops we follow since the last email.",
    digestCta: "View all new deals",
    digestAllDeals: "All new deals",
    digestInsteadOf: "instead of",
    digestFooter:
      "You're receiving this email because you signed up for the daily deals from {site}. Prices and stock may have changed since; the price in the shop applies. Some links are affiliate links.",
    unsubscribe: "Unsubscribe",
  },
};
