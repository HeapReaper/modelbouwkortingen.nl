-- Modelbouwkortingen.nl database schema.
-- Gedeeld door de Go crawler (schrijft) en de Next.js website (leest + contactformulier).
-- Wordt automatisch toegepast door de crawler bij het opstarten, of via `npm run db:migrate`.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS shops (
    id          SERIAL PRIMARY KEY,
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    base_url    TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    enabled     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
    slug       TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

INSERT INTO categories (slug, name, sort_order) VALUES
    ('rc-autos',       'RC Auto''s',            10),
    ('vliegtuigen',    'Vliegtuigen',           20),
    ('helicopters',    'Helicopters',           30),
    ('drones',         'Drones',                40),
    ('boten',          'Boten',                 50),
    ('werkvoertuigen', 'Werkvoertuigen',        60),
    ('tanks',          'Tanks & Militair',      70),
    ('zenders',        'Zenders & Ontvangers',  80),
    ('elektronica',    'Elektronica',           90),
    ('accus-laders',   'Accu''s & Laders',     100),
    ('onderdelen',     'Onderdelen',           110),
    ('gereedschap',    'Gereedschap',          120),
    ('overig',         'Overig',               999)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS products (
    id               BIGSERIAL PRIMARY KEY,
    shop_id          INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    external_id      TEXT NOT NULL,
    url              TEXT NOT NULL,
    sku              TEXT,
    name             TEXT NOT NULL,
    brand            TEXT,
    image_url        TEXT,
    category_slug    TEXT NOT NULL DEFAULT 'overig' REFERENCES categories(slug),
    shop_category    TEXT,
    price            NUMERIC(10,2) NOT NULL,
    -- "Van"-prijs zoals de webshop die toont (doorgestreept), of NULL.
    old_price        NUMERIC(10,2),
    -- Referentieprijs waartegen de korting berekend wordt: old_price, of de hoogste
    -- prijs die we in de afgelopen 30 dagen zelf gezien hebben.
    reference_price  NUMERIC(10,2),
    discount_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2)  NOT NULL DEFAULT 0,
    is_deal          BOOLEAN NOT NULL DEFAULT FALSE,
    in_stock         BOOLEAN,
    deal_since       TIMESTAMPTZ,
    first_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_crawled_at  TIMESTAMPTZ,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (shop_id, external_id)
);

CREATE INDEX IF NOT EXISTS products_deals_idx      ON products (is_deal, discount_percent DESC) WHERE is_deal;
CREATE INDEX IF NOT EXISTS products_deal_since_idx ON products (deal_since DESC) WHERE is_deal;
CREATE INDEX IF NOT EXISTS products_shop_idx       ON products (shop_id, is_deal);
CREATE INDEX IF NOT EXISTS products_category_idx   ON products (category_slug, is_deal);
CREATE INDEX IF NOT EXISTS products_crawled_idx    ON products (shop_id, last_crawled_at NULLS FIRST);
CREATE INDEX IF NOT EXISTS products_name_trgm_idx  ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS products_brand_trgm_idx ON products USING gin (brand gin_trgm_ops);

CREATE TABLE IF NOT EXISTS price_history (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price       NUMERIC(10,2) NOT NULL,
    old_price   NUMERIC(10,2),
    observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS price_history_product_idx ON price_history (product_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS crawl_runs (
    id             BIGSERIAL PRIMARY KEY,
    shop_id        INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at    TIMESTAMPTZ,
    status         TEXT NOT NULL DEFAULT 'running', -- running | ok | failed | aborted
    pages_fetched  INT NOT NULL DEFAULT 0,
    products_seen  INT NOT NULL DEFAULT 0,
    deals_found    INT NOT NULL DEFAULT 0,
    errors         INT NOT NULL DEFAULT 0,
    rate_limited   INT NOT NULL DEFAULT 0,
    message        TEXT
);
CREATE INDEX IF NOT EXISTS crawl_runs_shop_idx ON crawl_runs (shop_id, started_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
    id         BIGSERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT NOT NULL,
    message    TEXT NOT NULL,
    handled    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
