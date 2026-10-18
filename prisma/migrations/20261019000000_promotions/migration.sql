-- Uitgelichte webshops en producten (betaalde plaatsingen, beheerd in /admin).
-- CreateTable
CREATE TABLE "promotions" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "product_id" BIGINT,
    "starts_on" DATE NOT NULL,
    "ends_on" DATE,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promotions_period_idx" ON "promotions"("starts_on", "ends_on");

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
