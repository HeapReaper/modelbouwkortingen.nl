-- De crawler slaat van deze shops voortaan de prijs bij levering in Nederland op (zie
-- crawler/internal/shops/vat.go). Reken de bestaande prijzen en de prijshistorie op dezelfde
-- manier om: anders lijkt de overgang een prijsstijging, die lopende deals beëindigt.
-- discount_percent verandert niet: alle prijzen schuiven met dezelfde factor.
CREATE TEMP TABLE vat_factors AS
SELECT s.id AS shop_id, f.factor
FROM (VALUES
  ('tamico', 1.21 / 1.19),
  ('metz', 1.21 / 1.19),
  ('bauer', 1.21 / 1.19),
  ('hoellein', 1.21 / 1.19),
  ('rcteam', 1.21 / 1.20),
  ('ghw', 1.21),
  ('mrcmodelisme', 1.20)
) AS f(slug, factor)
JOIN shops s ON s.slug = f.slug;

UPDATE price_history h
SET price = round(h.price * f.factor, 2),
    old_price = round(h.old_price * f.factor, 2)
FROM products p
JOIN vat_factors f ON f.shop_id = p.shop_id
WHERE h.product_id = p.id;

UPDATE products p
SET price = round(p.price * f.factor, 2),
    old_price = round(p.old_price * f.factor, 2),
    reference_price = round(p.reference_price * f.factor, 2),
    discount_amount = round(p.discount_amount * f.factor, 2)
FROM vat_factors f
WHERE f.shop_id = p.shop_id;

DROP TABLE vat_factors;
