-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateTable
CREATE TABLE "shops" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "external_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "image_url" TEXT,
    "category_slug" TEXT NOT NULL DEFAULT 'overig',
    "shop_category" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "old_price" DECIMAL(10,2),
    "reference_price" DECIMAL(10,2),
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_deal" BOOLEAN NOT NULL DEFAULT false,
    "in_stock" BOOLEAN,
    "deal_since" TIMESTAMPTZ,
    "first_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_crawled_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "old_price" DECIMAL(10,2),
    "observed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_runs" (
    "id" BIGSERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'running',
    "pages_fetched" INTEGER NOT NULL DEFAULT 0,
    "products_seen" INTEGER NOT NULL DEFAULT 0,
    "deals_found" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "rate_limited" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,

    CONSTRAINT "crawl_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shops_slug_key" ON "shops"("slug");

-- CreateIndex
CREATE INDEX "products_deals_idx" ON "products"("is_deal", "discount_percent" DESC) WHERE (is_deal);

-- CreateIndex
CREATE INDEX "products_deal_since_idx" ON "products"("deal_since" DESC) WHERE (is_deal);

-- CreateIndex
CREATE INDEX "products_shop_idx" ON "products"("shop_id", "is_deal");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category_slug", "is_deal");

-- CreateIndex
CREATE INDEX "products_crawled_idx" ON "products"("shop_id", "last_crawled_at");

-- CreateIndex
CREATE INDEX "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_brand_trgm_idx" ON "products" USING GIN ("brand" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "products_shop_id_external_id_key" ON "products"("shop_id", "external_id");

-- CreateIndex
CREATE INDEX "price_history_product_idx" ON "price_history"("product_id", "observed_at" DESC);

-- CreateIndex
CREATE INDEX "crawl_runs_shop_idx" ON "crawl_runs"("shop_id", "started_at" DESC);

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_slug_fkey" FOREIGN KEY ("category_slug") REFERENCES "categories"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawl_runs" ADD CONSTRAINT "crawl_runs_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Seed: vaste categorieën
INSERT INTO "categories" ("slug", "name", "sort_order") VALUES
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
ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "sort_order" = EXCLUDED."sort_order";
