-- Per webshop categorieën verbergen (adminpanel). Producten in zo'n categorie blijven gecrawld,
-- maar staan nergens op de site. products.hidden houdt Postgres bij via triggers, zodat de
-- queries alleen "NOT hidden" hoeven te filteren.
CREATE TABLE "shop_hidden_categories" (
    "shop_id" INTEGER NOT NULL,
    "category_slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_hidden_categories_pkey" PRIMARY KEY ("shop_id","category_slug")
);

-- AddForeignKey
ALTER TABLE "shop_hidden_categories" ADD CONSTRAINT "shop_hidden_categories_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_hidden_categories" ADD CONSTRAINT "shop_hidden_categories_category_slug_fkey" FOREIGN KEY ("category_slug") REFERENCES "categories"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "products" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;

-- Nieuw product of andere categorie: opzoeken of die categorie bij deze shop verborgen is.
CREATE FUNCTION products_set_hidden() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.hidden := EXISTS (
        SELECT 1 FROM shop_hidden_categories h
        WHERE h.shop_id = NEW.shop_id AND h.category_slug = NEW.category_slug
    );
    RETURN NEW;
END
$$;

CREATE TRIGGER products_hidden
BEFORE INSERT OR UPDATE OF shop_id, category_slug ON "products"
FOR EACH ROW EXECUTE FUNCTION products_set_hidden();

-- Categorie verborgen of weer getoond: de producten van die shop in die categorie bijwerken.
CREATE FUNCTION shop_hidden_categories_sync() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE products SET hidden = true
        WHERE shop_id = NEW.shop_id AND category_slug = NEW.category_slug AND NOT hidden;
        RETURN NEW;
    END IF;
    UPDATE products SET hidden = false
    WHERE shop_id = OLD.shop_id AND category_slug = OLD.category_slug AND hidden;
    RETURN OLD;
END
$$;

CREATE TRIGGER shop_hidden_categories_sync
AFTER INSERT OR DELETE ON "shop_hidden_categories"
FOR EACH ROW EXECUTE FUNCTION shop_hidden_categories_sync();
