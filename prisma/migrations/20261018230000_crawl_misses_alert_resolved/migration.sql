-- "Afgehandeld" voor crawlermeldingen in /admin.
-- AlterTable
ALTER TABLE "crawl_alerts" ADD COLUMN "resolved_at" TIMESTAMPTZ;

-- Productpagina's zonder product, zodat de crawler ze een week overslaat (zie crawler/internal/store).
-- CreateTable
CREATE TABLE "crawl_misses" (
    "shop_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "crawled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_misses_pkey" PRIMARY KEY ("shop_id","url")
);

-- AddForeignKey
ALTER TABLE "crawl_misses" ADD CONSTRAINT "crawl_misses_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

