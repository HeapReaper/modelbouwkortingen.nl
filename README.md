# Modelbouwkortingen.nl

Kortingssite voor RC/modelbouw. Een Go-crawler volgt de producten van TopRC, Toemen en Wetronic.
Is een product **minstens €5 of 5%** afgeprijsd, dan komt het op de website (Next.js 16 + shadcn/ui).

```
├── src/              Next.js website (App Router, Cache Components, shadcn base-nova)
├── crawler/          Go crawler (multi-threaded)
├── prisma/           schema.prisma + migraties (Prisma Migrate)
├── Dockerfile        website-image
├── crawler/Dockerfile crawler-image
└── docker-compose.yml  Postgres + website + crawler
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

## Website

| Route | Wat |
| --- | --- |
| `/` | Hero met zoekbalk, rijen "Grootste kortingen" + "Net binnen", categorieën, webshops |
| `/aanbiedingen` | Alle deals met filters (categorie, shop, min. korting, prijs, voorraad) en sortering |
| `/categorie/[slug]` | Deals per categorie |
| `/webshops`, `/webshops/[slug]` | Deals per webshop |
| `/zoeken?q=` | Zoeken (naam, merk, SKU; pg_trgm-index) |
| `/product/[id]` | Detailpagina met prijsverloop en vergelijkbare deals |
| `/contact` | Contactformulier (Server Action, honeypot + rate limit, opgeslagen in Postgres) |
| `/over` | Uitleg + informatie voor webshops over de crawler |
| `/nieuwsbrief` | Aanmelden voor de dagelijkse kortingsmail (ook op de homepage en in de footer) |
| `/nieuwsbrief/bevestigen`, `/nieuwsbrief/afmelden` | Double opt-in en afmelden (knop, zodat virusscanners van mailproviders niets per ongeluk bevestigen) |
| `/api/nieuwsbrief/verzenden` | Verstuurt de dagelijkse mail (`Bearer NEWSLETTER_CRON_TOKEN` of admin-login; `?nu=1` negeert het verzenduur) |
| `/discord`, `/discord/afmelden` | Discord-webhook koppelen / afmelden |
| `/api/discord/verzenden` | Post nieuwe deals naar de webhooks (zelfde beveiliging als `/api/nieuwsbrief/verzenden`) |
| `/api/nieuwsbrief/afmelden` | Afmelden met één klik vanuit de mailclient (`List-Unsubscribe-Post`, RFC 8058) |
| `/admin` | Admin panel: live crawlerstatus, 429's, crawl-rondes, grafiek, berichten (Basic Auth) |
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
| `CRAWLER_INTERVAL` | crawler | `6h` |
| `CRAWLER_WORKERS_PER_SHOP` | crawler | `4` |
| `CRAWLER_HOST_DELAY` | crawler | `500ms` |
| `CRAWLER_MAX_PRODUCT_PAGES` | crawler | `4000` per shop per ronde |
| `MIN_DISCOUNT_EUR` / `MIN_DISCOUNT_PERCENT` | crawler | `5` / `5` |
