# Modelbouwkortingen.nl

Kortingssite voor RC/modelbouw. Een Go-crawler volgt de producten van 17 Nederlandse en Europese
modelbouw-webshops (zie [Crawler](#crawler)). Is een product **minstens €5 of 5%** afgeprijsd, dan
komt het op de website (Next.js 16 + shadcn/ui).

## Features

**Deals vinden**
- Deals op basis van onze eigen prijshistorie (niet de "van"-prijs van de webshop), met
  korting in € en %, en een check of de korting die de webshop zelf noemt klopt.
- Badges "Laagste prijs ooit" en "Laagste prijs in 30 dagen" (pas na 30/60 dagen volgen).
- Overzicht met filters (categorie, webshop, minimale korting, prijs, voorraad) en sortering.
- Pagina's per categorie, per webshop en per merk (`/merken`).
- Zoeken op naam, merk en artikelnummer (pg_trgm).
- Prijsvergelijker over álle producten: hetzelfde artikelnummer bij verschillende webshops,
  goedkoopste eerst.
- Productpagina met prijsverloop-grafiek, voorraad, land van de webshop, verzendkosten (als
  bekend), "Ook verkrijgbaar bij" (zelfde SKU elders) en vergelijkbare deals.

**Op de hoogte blijven**
- Volglijst zonder account (hartje; opgeslagen in de browser).
- Prijsalarm: één mail zodra een product onder een gekozen doelprijs komt (double opt-in).
- Dagelijkse kortingsmail (double opt-in, afmelden met één klik).
- Nieuwe deals automatisch in je eigen Discord-kanaal via een webhook.
- Voorkeuren voor mail en Discord: alleen bepaalde categorieën, webshops en minimale korting.
- RSS-feed (`/feed.xml`) met filters op categorie, webshop, merk en taal.

**Talen**
- Site in het Nederlands, Engels en Duits, met taaldetectie en taalkiezer.
- Productnamen van Duitstalige webshops automatisch vertaald via Amazon Translate.
- Mail en Discord in de taal waarin de abonnee zich aanmeldde.

**Delen en SEO**
- Gegenereerde deelafbeelding (Open Graph) per product met foto, prijs en korting.
- Structured data (schema.org Product/Offer), canonical- en `hreflang`-links, sitemap in alle
  talen, robots.txt.

**Beheer**
- Adminpanel: status van de diensten (database, SMTP, Amazon Translate, crawler, planner) met
  een knop voor een testmail, live crawlerstatus en crawler-logs, HTTP 429's, crawl-rondes, statistieken van de afgelopen 14
  dagen, kliks naar webshops, contactberichten, webshops aan/uit, telefoonnummers en
  social-medialinks.
- Bewaking van de crawler: een ronde met opvallend weinig producten (parser kapot?) komt in
  het adminpanel en optioneel in een Discord-kanaal.
- Klikteller voor uitgaande links (`/api/uit/[id]`) en affiliate-parameters per webshop.
- Contactformulier met honeypot en rate limit.
- Licht/donker thema, demo-modus zonder database, Docker/Coolify-deploy.
- Google AdSense (alleen in productie): script en `google-adsense-account`-meta in
  `src/app/[lang]/layout.tsx`, publisher-ID in `src/lib/ads.ts`, en `public/ads.txt`.
- Privacybeleid (`/privacy`, NL/EN/DE). De cookiemelding is die van Google (AdSense →
  Privacy en berichten, een door Google gecertificeerde CMP); "Cookie-instellingen" in de footer
  opent hem opnieuw.

```
├── src/              Next.js website (App Router, Cache Components, shadcn base-nova)
├── crawler/          Go crawler (multi-threaded)
├── prisma/           schema.prisma + migraties (Prisma Migrate)
├── Dockerfile        website- en migratie-image
├── crawler/Dockerfile crawler-image
├── docker-compose.yml  Postgres + website + crawler (images uit het register)
├── docker-compose.build.yml  zelf bouwen i.p.v. ophalen
└── .forgejo/         CI: images bouwen en pushen (Codeberg)
```

## Snel starten

```bash
cp .env.example .env          # vul DATABASE_URL en ADMIN_PASSWORD in
npm install
npm run db:migrate            # Prisma-migraties toepassen (prisma migrate deploy)
npm run dev                   # http://localhost:3000

cd crawler
go run ./cmd/crawler          # crawlt continu, elke 6 uur een nieuwe ronde
go run ./cmd/crawler -once -shops toemen -max-products 50   # kleine testronde
go run ./cmd/crawler -once -dry-run -max-listings 3          # zonder database, alleen loggen
```

Zonder `DATABASE_URL` draait de website in **demo-modus** met voorbeelddata.

Alles in Docker / Coolify: `docker-compose.yml` is geschikt voor de Docker Compose build pack van Coolify.
Coolify genereert de database-credentials en het crawler-token zelf (`SERVICE_*` variabelen) en
koppelt het domein aan de `web`-service via `SERVICE_FQDN_WEB_3000`. Stel in Coolify alleen nog
`ADMIN_PASSWORD` (en optioneel `STATS_TOKEN`) in.

### Images (Codeberg CI)

De server bouwt niets: Forgejo Actions op Codeberg (`.forgejo/workflows/images.yml`) bouwt bij
elke push naar `main` drie images en zet ze in het register van Codeberg:

| Image | Wat |
| --- | --- |
| `codeberg.org/heapreaper/modelbouwkortingen-web` | website (Next.js standalone) |
| `codeberg.org/heapreaper/modelbouwkortingen-migrate` | Prisma-migraties (eenmalig) |
| `codeberg.org/heapreaper/modelbouwkortingen-crawler` | crawler |

Elk image krijgt de tags `latest` en `sha-<commit>`. `docker-compose.yml` haalt `${IMAGE_TAG:-latest}`
op (`pull_policy: always`); zet `IMAGE_TAG=sha-abc1234` in Coolify om terug te gaan naar een oudere versie.

De runners van Codeberg hebben geen Docker daemon. Daarom bouwt Buildah de images
(`.forgejo/buildah.sh`). De Next- en Go-build draaien vooraf in de job zelf, en Buildah kopieert
alleen het resultaat (Dockerfile-targets `runner-prebuilt` en `prebuilt`). Lokaal bouwen
met de gewone multi-stage Dockerfiles kan nog steeds:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

Eenmalig instellen:

1. Codeberg → repo → Instellingen → Units: zet **Actions** aan. De runners van Codeberg werken alleen
   voor publieke repo's met een vrije licentie.
2. Codeberg → Instellingen (gebruiker) → Applicaties: maak een access token met **package: read and write**.
   Zet het in de repo bij Instellingen → Actions → Geheimen als `REGISTRY_TOKEN`.
3. Optioneel automatisch deployen: zet de deploy-webhook van de resource in Coolify (Webhooks) als
   `COOLIFY_WEBHOOK` en een API-token van Coolify als `COOLIFY_TOKEN`. Zet dan in Coolify de
   automatische deploy bij een git-push uit. Anders deployt Coolify voordat de nieuwe images klaar zijn.

## Website

| Route | Wat |
| --- | --- |
| `/` | Hero met zoekbalk, rijen "Grootste kortingen" + "Net binnen", categorieën, webshops |
| `/aanbiedingen` | Alle deals met filters (categorie, shop, min. korting, prijs, voorraad) en sortering |
| `/categorie/[slug]` | Deals per categorie |
| `/webshops`, `/webshops/[slug]` | Deals per webshop |
| `/zoeken?q=` | Zoeken (naam, merk, SKU; pg_trgm-index) |
| `/prijsvergelijker?q=` | Prijsvergelijker: zoekt in álle producten (niet alleen deals) en toont per product alle webshops van goedkoop naar duur. Zelfde product = zelfde artikelnummer (SKU zonder spaties/streepjes); producten die 14 dagen niet gezien zijn tellen niet mee |
| `/product/[id]` | Detailpagina met prijsverloop, prijsalarm, "Ook verkrijgbaar bij" en vergelijkbare deals |
| `/merken`, `/merk/[slug]` | Merken met lopende deals, en de deals per merk |
| `/volglijst` | Gevolgde producten (id's in `localStorage`, de server rendert ze via `?ids=`) |
| `/prijsalarm/bevestigen`, `/prijsalarm/afmelden` | Prijsalarm bevestigen (double opt-in) en stoppen |
| `/api/prijsalarm/controleren` | Verstuurt alarmen waarvan de doelprijs bereikt is (zelfde beveiliging als `/api/nieuwsbrief/verzenden`) |
| `/contact` | Contactformulier (Server Action, honeypot + rate limit, opgeslagen in Postgres) |
| `/privacy` | Privacybeleid met cookie-uitleg en knop om de cookiekeuze te wijzigen |
| `/over` | Uitleg + informatie voor webshops over de crawler |
| `/nieuwsbrief` | Aanmelden voor de dagelijkse kortingsmail (ook op de homepage en in de footer) |
| `/nieuwsbrief/voorkeuren`, `/discord/voorkeuren` | Categorieën, webshops en minimale korting kiezen (link in elke mail en elk welkomstbericht) |
| `/nieuwsbrief/bevestigen`, `/nieuwsbrief/afmelden` | Double opt-in en afmelden (knop, zodat virusscanners van mailproviders niets per ongeluk bevestigen) |
| `/api/nieuwsbrief/verzenden` | Verstuurt de dagelijkse mail (`Bearer NEWSLETTER_CRON_TOKEN` of admin-login; `?nu=1` negeert het verzenduur) |
| `/discord`, `/discord/afmelden` | Discord-webhook koppelen / afmelden |
| `/api/discord/verzenden` | Post nieuwe deals naar de webhooks (zelfde beveiliging als `/api/nieuwsbrief/verzenden`) |
| `/api/nieuwsbrief/afmelden` | Afmelden met één klik vanuit de mailclient (`List-Unsubscribe-Post`, RFC 8058) |
| `/feed.xml` | RSS-feed met de nieuwste 50 deals; `?categorie=`, `?shop=`, `?merk=`, `?lang=` |
| `/api/og/[id]` | Deelafbeelding (1200×630) voor een product; `?lang=` voor de vertaalde naam |
| `/api/uit/[id]` | Telt de klik (`outbound_clicks`, zonder bots) en stuurt door naar de webshop, met affiliate-parameters |
| `/api/vertalen/bijwerken` | Vertaalt namen van nieuwe deals van Duitstalige webshops (zelfde beveiliging als `/api/nieuwsbrief/verzenden`) |
| `/api/crawler/controleren` | Zoekt crawl-rondes met opvallend weinig producten en meldt ze (idem) |
| `/admin` | Admin panel: status van database/SMTP/Amazon Translate/crawler, testmail, live crawlerstatus, 429's, crawl-rondes, grafiek, kliks, berichten, webshops aan/uit, telefoonnummers en social media (Basic Auth) |
| `/api/stats` | JSON met alle statistieken (Basic Auth of `Bearer STATS_TOKEN`) |
| `/api/health` | Publieke health check |

### Talen (Nederlands, Engels, Duits)

Alle pagina's staan onder `src/app/[lang]/`. Nederlands houdt de oorspronkelijke URL's zonder
prefix (`src/proxy.ts` herschrijft `/aanbiedingen` intern naar `/nl/aanbiedingen`); Engels en
Duits staan onder `/en/…` en `/de/…`, met dezelfde (Nederlandse) paden.

- **Detectie:** bij een URL zonder prefix stuurt de proxy door naar `/en` of `/de` als de
  bezoeker die taal koos (cookie `NEXT_LOCALE`, gezet door de taalkiezer in de navbar) of, zonder
  keuze, als de browser die taal liever wil (`Accept-Language`). Zonder `Accept-Language` (zoals
  bij de meeste zoekmachines) blijft het Nederlands; een andere browsertaal (bv. Frans) krijgt Engels.
- **Teksten:** `src/i18n/dictionaries/{nl,en,de}.ts`. `nl.ts` is de bron; `en` en `de` hebben
  hetzelfde type, dus een ontbrekende vertaling is een TypeScript-fout. Server Components gebruiken
  `await getI18n()` (via `next/root-params`), Client Components `useI18n()`; Server Actions en mails
  krijgen de taal expliciet mee.
- **Links:** altijd via `href()`/`localePath()`, zodat ze in de huidige taal blijven.
- **SEO:** elke pagina heeft canonical + `hreflang`-links, en de sitemap bevat alle talen.
- **Mail en Discord:** abonnees krijgen berichten in de taal waarin ze zich aanmeldden
  (kolom `locale`).

### Dagelijkse kortingsmail

Bezoekers melden zich aan met hun e-mailadres en bevestigen via een link (double opt-in).
Elke dag vanaf `NEWSLETTER_SEND_HOUR` (Nederlandse tijd) krijgen bevestigde abonnees de
deals die sinds de vorige mail zijn ontstaan: hoogste korting eerst, maximaal 12, hooguit
3 per webshop. Zijn er geen nieuwe deals, dan gaat er niets uit. Productlinks gebruiken
`productLink()` uit `src/lib/shops.ts`, dus affiliate-links werken ook in de mail.

De planner zit in `src/instrumentation.ts` en roept elke 5 minuten
`POST /api/nieuwsbrief/verzenden` aan. De tabel `newsletter_runs` heeft één rij per dag als
slot, dus ook met meerdere servers of na een herstart gaat de mail hooguit één keer per dag
uit. Gebruik je liever een externe cron, zet dan `NEWSLETTER_SCHEDULER=off` en
`NEWSLETTER_CRON_TOKEN`.

### Deals in Discord

Op `/discord` plakt iemand een Discord-webhook-URL. We accepteren alleen `discord.com/api/webhooks/…`,
controleren bij Discord dat de webhook bestaat en sturen een welkomstbericht met afmeldlink.
Dezelfde planner (`src/instrumentation.ts`) roept elke 5 minuten `POST /api/discord/verzenden`
aan: elke nieuwe deal gaat als embed (prijs, was-prijs, korting, foto, affiliate-link via
`productLink()`) naar alle actieve webhooks, 10 embeds per bericht en maximaal 50 deals per
webhook per ronde. Elke abonnee heeft een eigen cursor (`deal_since`, product-id) die pas
opschuift na een geslaagd bericht. Geeft Discord 401/403/404 (webhook verwijderd), dan wordt
het abonnement uitgezet.

### Productnamen vertalen

Duitstalige webshops (`language: "de"` in `src/lib/shops.ts`) hebben Duitse productnamen. Voor
Nederlandse en Engelse bezoekers worden die vertaald met **Amazon Translate**
(`src/lib/translate.ts`); Duitse bezoekers zien de originele naam. Elke naam wordt één keer per
taal vertaald en bewaard in `product_translations`; verandert de naam bij de webshop, dan wordt
hij opnieuw vertaald. De planner vertaalt elke 5 minuten de nieuwe deals vooraf
(`/api/vertalen/bijwerken`); andere producten worden vertaald zodra iemand ze bekijkt. Duurt dat
langer dan 2 seconden, dan toont de pagina die keer de Duitse naam. Op de productpagina staat de
originele naam onder de vertaalde.

**Kosten in de hand:** bots (zoekmachines, linkvoorbeelden, scrapers; herkend aan de
user-agent in `src/lib/bots.ts`) laten nooit iets nieuws vertalen: zij zien bewaarde vertalingen
of de Duitse naam. Daarnaast vertaalt de site per dag (Nederlandse tijd) hooguit
`TRANSLATE_DAILY_CHAR_LIMIT` tekens (standaard 10.000, ≈ $0,15), voor pagina's, planner en mail
samen; daarna tot middernacht alleen bewaarde vertalingen. Het verbruik van vandaag staat in
`/admin` bij Diensten.

Zet `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` en `AWS_REGION` (bv. `eu-central-1`), van een
IAM-gebruiker die alleen `translate:TranslateText` mag. Zonder sleutels worden alleen al bewaarde
vertalingen getoond.

### Prijsalarm en volglijst

Op elke productpagina kan een bezoeker een doelprijs instellen. Na bevestiging per mail volgt
één mail zodra de prijs op of onder die doelprijs komt (maximaal 25 lopende alarmen per
e-mailadres; prijzen ouder dan 2 dagen tellen niet). De planner controleert dit elke 5 minuten.

De volglijst (hartje op elke deal) heeft geen account nodig: de product-id's staan in
`localStorage` (maximaal 100). Werkt de opslag niet (privévenster), dan is de lijst gewoon leeg.

### Bewaking van de crawler

Ziet een crawl-ronde minder dan de helft (`CRAWL_ALERT_RATIO`) van het mediaan van de vorige 5
rondes van die shop, dan heeft de webshop waarschijnlijk zijn HTML veranderd. Zo'n ronde komt in
`crawl_alerts` (zichtbaar in `/admin`) en, als `ALERT_DISCORD_WEBHOOK` is ingesteld, in dat
Discord-kanaal. Shops met minder dan 50 producten worden overgeslagen. Een ronde die kort na de
vorige start (bv. na een deploy) ziet vanzelf minder producten, omdat productpagina's die minder
dan `CRAWLER_RECRAWL_AFTER` (20 uur) geleden bezocht zijn worden overgeslagen; daarom telt een
ronde pas als ook het aantal producten per opgehaalde pagina sterk daalt.

Het thema (rood + "prijskaartje"-geel, groen voor besparingen) staat in `src/app/globals.css`.
Licht/donker volgt het systeem en kan in de navbar aangepast worden.

## Crawler

Per shop staat in `crawler/internal/shops/*.go` hoe de site in elkaar zit:

| Shop | Platform | Bron van producten | Bron van "van"-prijzen |
| --- | --- | --- | --- |
| TopRC | Magento 2 (Hyvä) | `/sitemap/sitemap.xml` (`*.html`) | categoriepagina's (`data-price-type="oldPrice"`), `/aanbiedingen/` |
| Toemen | WooCommerce | `product-sitemapN.xml` | `<del>`/`<ins>` op categorie- en productpagina's, `/deals-2026` |
| Wetronic | OpenCart (Journal) | uksb image-sitemaps | `route=product/special` (met paginering), `.product-price-old` |
| Hoellein (DE) | Shopify | `sitemap_products_N.xml` | `/products.json?limit=250` (alle producten in ~41 requests) |
| Modellbau Berlinski (DE) | eigen systeem | `/sitemap2.xml` (~45 MB; URL's met `<image:image>`) | onderste categorieën, `/categorie/2/` |
| Mini-Zshop | WooCommerce | `minizshop-sitemap-products-N.xml` | onderste categorieën, `?product-page=N` |
| MG-Modellbau (DE) | eigen systeem | `sitemapN.xml` (`.html`) | onderste categorieën, `?apg=N` |
| Hacker Motor (DE) | e-vendo | geen sitemap: categorieboom volgen | categoriepagina's, `&Start=60` |
| RC Motorsports | Shopify | `sitemap_products_N.xml` (microdata, geen JSON-LD) | `/products.json?limit=250` (~50 requests) |
| Droneshop.nl | Magento 2 (yourstore) | `/sitemap/sitemap.xml` (URL's met `<image:image>`) | onderste categorieën onder `/drones`, `/accessoires`, `/onderdelen` + `/populair/aanbiedingen`, `?p=N` |
| Tamico (DE) | JTL-Shop 5 | geen (XML-sitemap is gzip en dubbel DE/EN): alleen listings | subcategorieën uit `/Sitemap`, `?af=50`, `_sN` (Crawl-delay 5s, ~1.000 requests) |
| ChinaHobbyLine (CNHL) | Shopify (USD) | geen: productpagina's tonen dollars | `/nl/products.json?country=NL` (europrijzen via Shopify Markets) |
| Hepf (AT) | JTL-Shop 5 | geen: alleen listings | subcategorieën uit `/Sitemap`, 24 per pagina via `_sN` (`?af=` is verboden) |
| Bliek Modelbouw | Magento 2 | `bliek_modelbouw-8-N.xml` (alleen voor de categorieën) | onderste RC-/verf-/uitloper-categorieën, `?product_list_limit=32`, `?p=N` |
| Aerobertics (BE) | eigen systeem (ASP.NET) | geen sitemap: menu op `/nl/homepage` | onderste categorieën, `?Page=N` |
| Heligear | CCV Shop | `/ExportBestanden/SiteMap.php` (~1.000 producten) | geen: alle productpagina's (JSON-LD) |
| Area51 RC (ES) | PrestaShop 1.4 | geen: XML-sitemap is dubbel EN/ES | alle ~1.250 categorieën uit de boom (PrestaShop 1.4 toont alleen direct gekoppelde producten), `?n=50&p=N` |

`wetronics.nl` verwijst door naar **wetronic.nl**; daarom heet de shop `wetronic`.

Elke ronde:
1. Sitemaps lezen; aanbiedingenpagina's vinden via de homepage.
2. **Listingpagina's** (pagina 1 van elke categorie; paginering is via robots.txt verboden bij TopRC/Toemen) → veel prijzen + "van"-prijzen tegelijk.
3. **Productpagina's** (max. `CRAWLER_MAX_PRODUCT_PAGES` per ronde): eerst bestaande deals, dan nieuwe, dan de langst niet bezochte.
4. Deals die 4 dagen niet meer gezien zijn worden uitgezet.

**Wanneer is iets een deal?** Alleen op basis van onze eigen prijswaarnemingen (`price_history`); de
"van"-prijs van de shop telt niet mee. De eerste waarneming is de nulmeting. Zakt de prijs ≥ €5 of ≥ 5%
onder de hoogste prijs die wij sinds de nulmeting zagen (max. 30 dagen terug) → deal. Tijdens de deal blijft
die referentieprijs vast; zakt de prijs verder, dan groeit de korting. Stijgt de prijs weer, dan is de deal
voorbij en geldt de nieuwe prijs als nulmeting (`baseline_since`). Tweedehands/occasions worden
overgeslagen (hun "van"-prijs is de nieuwprijs), net als kortingen boven 90% (vrijwel altijd parse-fouten).

**Netjes crawlen:**
- User-agent ziet eruit als Chrome, maar met `ModelbouwkortingenBot/1.0; +https://modelbouwkortingen.nl/over`, plus een `From`-header.
- robots.txt wordt gerespecteerd, ook bij redirects, inclusief `Crawl-delay` (Mini-Zshop: 10s per request;
  daar halen we per ronde maar 300 productpagina's op, de prijzen komen uit de categoriepagina's).
- Shopify/Cloudflare (Hoellein, RC Motorsports, ChinaHobbyLine) blokkeert een Chrome-user-agent vanuit Go met HTTP 429; die shops krijgen
  een eerlijke bot-user-agent en minimaal 1s tussen requests (`HostPolicy` in `crawler/internal/shops`).
- Per host minimaal `CRAWLER_HOST_DELAY` (500ms) tussen requests; alle shops lopen parallel met `CRAWLER_WORKERS_PER_SHOP` workers.
- **HTTP 429/503**: die host pauzeert 5s, bij een volgende 429 10s, 20s, … (max 5 min, of `Retry-After`).
  Ondertussen crawlen de andere shops gewoon door. Na een 429 gaat het tempo voor die host ook omlaag, en
  na een reeks succesvolle requests weer langzaam omhoog. (TopRC is hier gevoelig voor.)

Live stats: `http://<crawler>:8080/stats` (JSON) en `/healthz`. De website toont ze op `/admin` via `CRAWLER_STATS_URL`.
De laatste 5.000 logregels (en apart de laatste 1.000 waarschuwingen en fouten) staan op `/logs`
(`?level=WARN&shop=toprc&q=429&products=0&after=<seq>`, zelfde token als `/stats`); `/admin` toont ze live.

Productpagina's waarop geen product gevonden wordt (bv. uit het assortiment gehaald) staan met
`LOG_LEVEL=debug` in de log.

Werkt een shop zijn HTML om? Sla een pagina op en test de parser:

```bash
cd crawler
go run ./cmd/parsecheck -shop toemen -kind product -url https://www.toemen.nl/product/... pagina.html
go test ./...
```

## Configuratie

Zie `.env.example` voor alle variabelen. De belangrijkste:

| Variabele | Waar | Standaard |
| --- | --- | --- |
| `DATABASE_URL` | beide | — (website: demo-modus) |
| `ADMIN_PASSWORD` / `ADMIN_USER` | website | admin uit / `admin` |
| `CRAWLER_STATS_URL` | website | — |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | website | — / `587` (zonder SMTP: geen mail) |
| `MAIL_FROM` | website | — |
| `NEWSLETTER_SEND_HOUR` | website | `8` |
| `NEWSLETTER_SCHEDULER` / `NEWSLETTER_CRON_TOKEN` | website | planner aan / — |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` | website | — / — / `eu-central-1` (zonder: geen nieuwe vertalingen) |
| `TRANSLATE_DAILY_CHAR_LIMIT` | website | `10000` tekens per dag |
| `ALERT_DISCORD_WEBHOOK` / `CRAWL_ALERT_RATIO` | website | — / `0.5` |
| `CRAWLER_INTERVAL` | crawler | `6h` |
| `CRAWLER_WORKERS_PER_SHOP` | crawler | `4` |
| `CRAWLER_HOST_DELAY` | crawler | `500ms` |
| `CRAWLER_MAX_PRODUCT_PAGES` | crawler | `4000` per shop per ronde |
| `MIN_DISCOUNT_EUR` / `MIN_DISCOUNT_PERCENT` | crawler | `5` / `5` |

## Licentie

[MIT](LICENSE)
