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
| `/admin` | Admin panel: live crawlerstatus, 429's, crawl-rondes, grafiek, berichten (Basic Auth) |
| `/api/stats` | JSON met alle statistieken (Basic Auth of `Bearer STATS_TOKEN`) |
| `/api/health` | Publieke health check |

Het thema (rood + "prijskaartje"-geel, groen voor besparingen) staat in `src/app/globals.css`.
Licht/donker volgt het systeem en kan in de navbar aangepast worden.

## Crawler

Per shop staat in `crawler/internal/shops/*.go` hoe de site in elkaar zit:

| Shop | Platform | Bron van producten | Bron van "van"-prijzen |
| --- | --- | --- | --- |
| TopRC | Magento 2 (Hyvä) | `/sitemap/sitemap.xml` (`*.html`) | categoriepagina's (`data-price-type="oldPrice"`), `/aanbiedingen/` |
| Toemen | WooCommerce | `product-sitemapN.xml` | `<del>`/`<ins>` op categorie- en productpagina's, `/deals-2026` |
| Wetronic | OpenCart (Journal) | uksb image-sitemaps | `route=product/special` (met paginering), `.product-price-old` |

`wetronics.nl` verwijst door naar **wetronic.nl**; daarom heet de shop `wetronic`.

Elke ronde:
1. Sitemaps lezen; aanbiedingenpagina's vinden via de homepage.
2. **Listingpagina's** (pagina 1 van elke categorie; paginering is via robots.txt verboden bij TopRC/Toemen) → veel prijzen + "van"-prijzen tegelijk.
3. **Productpagina's** (max. `CRAWLER_MAX_PRODUCT_PAGES` per ronde): eerst bestaande deals, dan nieuwe, dan de langst niet bezochte.
4. Deals die 4 dagen niet meer gezien zijn worden uitgezet.

**Wanneer is iets een deal?** Referentieprijs = de "van"-prijs van de shop, óf de hoogste prijs die wij
de afgelopen 30 dagen zagen (`price_history`). Korting ≥ €5 of ≥ 5% → deal. Tweedehands/occasions worden
overgeslagen (hun "van"-prijs is de nieuwprijs), net als kortingen boven 90% (vrijwel altijd parse-fouten).

**Netjes crawlen:**
- User-agent ziet eruit als Chrome, maar met `ModelbouwkortingenBot/1.0; +https://modelbouwkortingen.nl/over`, plus een `From`-header.
- robots.txt wordt gerespecteerd, ook bij redirects.
- Per host minimaal `CRAWLER_HOST_DELAY` (500ms) tussen requests; alle shops lopen parallel met `CRAWLER_WORKERS_PER_SHOP` workers.
- **HTTP 429/503**: die host pauzeert 5s, bij een volgende 429 10s, 20s, … (max 5 min, of `Retry-After`).
  Ondertussen crawlen de andere shops gewoon door. Na een 429 gaat het tempo voor die host ook omlaag, en
  na een reeks succesvolle requests weer langzaam omhoog. (TopRC is hier gevoelig voor.)

Live stats: `http://<crawler>:8080/stats` (JSON) en `/healthz`. De website toont ze op `/admin` via `CRAWLER_STATS_URL`.

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
| `CRAWLER_INTERVAL` | crawler | `6h` |
| `CRAWLER_WORKERS_PER_SHOP` | crawler | `4` |
| `CRAWLER_HOST_DELAY` | crawler | `500ms` |
| `CRAWLER_MAX_PRODUCT_PAGES` | crawler | `4000` per shop per ronde |
| `MIN_DISCOUNT_EUR` / `MIN_DISCOUNT_PERCENT` | crawler | `5` / `5` |
