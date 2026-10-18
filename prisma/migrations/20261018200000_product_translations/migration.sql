-- CreateTable
CREATE TABLE "product_translations" (
    "product_id" BIGINT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_translations_pkey" PRIMARY KEY ("product_id","locale")
);

-- CreateIndex
CREATE INDEX "product_translations_name_trgm_idx" ON "product_translations" USING GIN ("name" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
