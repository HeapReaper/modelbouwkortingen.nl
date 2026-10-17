-- AlterTable
ALTER TABLE "discord_subscribers" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "min_discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shops" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "newsletter_subscribers" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "min_discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shops" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
-- Genormaliseerd artikelnummer, door Postgres zelf bijgehouden via een trigger (de crawler hoeft er
-- niets voor te doen). Zelfde regels als normalizeSku() in src/lib/compare.ts: hoofdletters, alleen
-- A-Z en 0-9, minstens 4 tekens en minstens één cijfer; anders NULL.
-- Bewust een trigger en geen GENERATED-kolom: die ziet Prisma als afwijkende default (drift).
ALTER TABLE "products" ADD COLUMN "sku_norm" TEXT;

CREATE FUNCTION normalize_sku(raw TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT CASE WHEN length(s) >= 4 AND s ~ '[0-9]' THEN s END
    FROM (SELECT upper(regexp_replace(coalesce(raw, ''), '[^A-Za-z0-9]', '', 'g')) AS s) n
$$;

CREATE FUNCTION products_set_sku_norm() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.sku_norm := normalize_sku(NEW.sku);
    RETURN NEW;
END
$$;

CREATE TRIGGER products_sku_norm
BEFORE INSERT OR UPDATE OF sku ON "products"
FOR EACH ROW EXECUTE FUNCTION products_set_sku_norm();

UPDATE "products" SET "sku_norm" = normalize_sku("sku") WHERE "sku" IS NOT NULL;

-- CreateTable
CREATE TABLE "price_alerts" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "email" TEXT NOT NULL,
    "target_price" DECIMAL(10,2) NOT NULL,
    "token" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'nl',
    "confirmed_at" TIMESTAMPTZ,
    "triggered_at" TIMESTAMPTZ,
    "triggered_price" DECIMAL(10,2),
    "cancelled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_clicks" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT,
    "shop_id" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'site',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbound_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_alerts" (
    "run_id" BIGINT NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "seen" INTEGER NOT NULL,
    "baseline" INTEGER NOT NULL,
    "notified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_alerts_pkey" PRIMARY KEY ("run_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "price_alerts_token_key" ON "price_alerts"("token");

-- CreateIndex
CREATE INDEX "price_alerts_product_idx" ON "price_alerts"("product_id");

-- CreateIndex
CREATE INDEX "price_alerts_email_idx" ON "price_alerts"("email");

-- CreateIndex
CREATE INDEX "price_alerts_active_idx" ON "price_alerts"("confirmed_at") WHERE (triggered_at IS NULL AND cancelled_at IS NULL);

-- CreateIndex
CREATE INDEX "outbound_clicks_created_idx" ON "outbound_clicks"("created_at");

-- CreateIndex
CREATE INDEX "outbound_clicks_shop_idx" ON "outbound_clicks"("shop_id", "created_at");

-- CreateIndex
CREATE INDEX "outbound_clicks_product_idx" ON "outbound_clicks"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "crawl_alerts_created_idx" ON "crawl_alerts"("created_at" DESC);

-- CreateIndex
CREATE INDEX "products_sku_norm_idx" ON "products"("sku_norm");

-- CreateIndex
CREATE INDEX "products_brand_idx" ON "products"("brand");

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_clicks" ADD CONSTRAINT "outbound_clicks_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crawl_alerts" ADD CONSTRAINT "crawl_alerts_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "crawl_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
