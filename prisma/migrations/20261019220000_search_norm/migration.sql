-- Naam + merk in kleine letters zonder spaties/streepjes/leestekens, zodat zoeken op "eflite" ook
-- "E-flite" en "E-FLITE" vindt (en "e-flite" ook "Eflite"). Zelfde regels als searchNorm() in
-- src/lib/deals.ts. Net als sku_norm door Postgres bijgehouden via een trigger.
ALTER TABLE "products" ADD COLUMN "search_norm" TEXT;

CREATE FUNCTION normalize_search(raw TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
    SELECT regexp_replace(lower(coalesce(raw, '')), '[^a-z0-9]', '', 'g')
$$;

CREATE FUNCTION products_set_search_norm() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.search_norm := normalize_search(NEW.name || ' ' || coalesce(NEW.brand, ''));
    RETURN NEW;
END
$$;

CREATE TRIGGER products_search_norm
BEFORE INSERT OR UPDATE OF name, brand ON "products"
FOR EACH ROW EXECUTE FUNCTION products_set_search_norm();

UPDATE "products" SET "search_norm" = normalize_search("name" || ' ' || coalesce("brand", ''));
