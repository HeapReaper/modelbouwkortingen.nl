-- Sneller zoeken (prijsvergelijker, partfinder, zoekbalk). Een zoekterm was een OR over naam,
-- merk, sku, vertaalde naam en search_norm. search_norm had geen index, dus Postgres liep bij
-- elke zoekopdracht de hele products-tabel door. Nu:
--   - search_norm bevat ook de actuele vertalingen van de naam (product_translations met
--     source_name = de huidige naam), zodat de zoekterm alleen search_norm en sku nodig heeft;
--   - een trigram-index op search_norm, zodat die OR via twee indexen kan.

-- Naam + merk + actuele vertalingen, genormaliseerd zoals normalize_search().
CREATE FUNCTION product_search_norm(pid BIGINT, pname TEXT, pbrand TEXT) RETURNS TEXT
LANGUAGE sql STABLE PARALLEL SAFE AS $$
    SELECT normalize_search(
        pname || ' ' || coalesce(pbrand, '') || ' ' || coalesce(
            (SELECT string_agg(t.name, ' ' ORDER BY t.locale)
             FROM product_translations t
             WHERE t.product_id = pid AND t.source_name = pname),
            ''))
$$;

CREATE OR REPLACE FUNCTION products_set_search_norm() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.search_norm := product_search_norm(NEW.id, NEW.name, NEW.brand);
    RETURN NEW;
END
$$;

-- Een nieuwe, gewijzigde of verwijderde vertaling werkt search_norm van het product bij. Dat
-- UPDATE raakt alleen search_norm, dus de trigger op products (UPDATE OF name, brand) loopt niet.
CREATE FUNCTION product_translations_set_search_norm() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    pid BIGINT := CASE WHEN TG_OP = 'DELETE' THEN OLD.product_id ELSE NEW.product_id END;
BEGIN
    UPDATE "products" p
    SET "search_norm" = product_search_norm(p.id, p.name, p.brand)
    WHERE p.id = pid;
    RETURN NULL;
END
$$;

CREATE TRIGGER product_translations_search_norm
AFTER INSERT OR UPDATE OR DELETE ON "product_translations"
FOR EACH ROW EXECUTE FUNCTION product_translations_set_search_norm();

UPDATE "products" p
SET "search_norm" = product_search_norm(p.id, p.name, p.brand)
WHERE p.id IN (SELECT product_id FROM "product_translations");

-- CreateIndex
CREATE INDEX "products_search_norm_trgm_idx" ON "products" USING GIN ("search_norm" gin_trgm_ops);
