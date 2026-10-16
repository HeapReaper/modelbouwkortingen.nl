-- Deals worden voortaan alleen bepaald op basis van eigen prijswaarnemingen
-- (niet meer op de "van"-prijs van de webshop).
ALTER TABLE "products" ADD COLUMN "baseline_since" TIMESTAMPTZ;

-- Bestaande deals opnieuw laten beoordelen door de crawler met de nieuwe regels.
UPDATE "products"
SET "is_deal" = false, "deal_since" = NULL, "reference_price" = NULL,
    "discount_amount" = 0, "discount_percent" = 0
WHERE "is_deal" OR "reference_price" IS NOT NULL;
