-- deal_since en de Discord-cursor afronden op milliseconden (de precisie van een JS Date), zodat
-- de cursor (deal_since, id) een deal exact kan aanwijzen. Zie getDealsAfter() in src/lib/deals.ts.
UPDATE "products" SET "deal_since" = date_trunc('milliseconds', "deal_since")
WHERE "deal_since" IS NOT NULL AND "deal_since" <> date_trunc('milliseconds', "deal_since");

UPDATE "discord_subscribers" SET "cursor_at" = date_trunc('milliseconds', "cursor_at")
WHERE "cursor_at" <> date_trunc('milliseconds', "cursor_at");
