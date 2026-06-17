-- =============================================================================
-- Kore Repuestos · Seed 002 — Productos de muestra
-- -----------------------------------------------------------------------------
-- Carga productos representativos para que el frontend tenga datos reales
-- de catálogo durante el desarrollo y demo del Sprint 1.
-- =============================================================================

BEGIN;

INSERT INTO products (sku, name, description, category_id, brand, price, cost, stock, min_stock, unit)
SELECT 'PAS-001', 'Pastilla de freno delantera Toyota Corolla 2014-2019',
       'Pastilla cerámica de baja emisión de polvo.',
       (SELECT id FROM product_categories WHERE slug = 'frenos-pastillas'),
       'Bosch',
       42.50, 24.00, 35, 10, 'juego'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PAS-001');

INSERT INTO products (sku, name, description, category_id, brand, price, cost, stock, min_stock, unit)
SELECT 'DIS-018', 'Disco de freno ventilado 280mm',
       'Disco para vehículos compactos. Compatible con líneas Toyota / Honda.',
       (SELECT id FROM product_categories WHERE slug = 'frenos-discos'),
       'Brembo',
       89.90, 58.00, 18, 5, 'unidad'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'DIS-018');

INSERT INTO products (sku, name, description, category_id, brand, price, cost, stock, min_stock, unit)
SELECT 'BUJ-IR4', 'Bujía iridio NGK BKR6EIX',
       'Bujía de iridio para motores 1.4 - 2.0L gasolina.',
       (SELECT id FROM product_categories WHERE slug = 'motor-bujias'),
       'NGK',
       15.00, 7.50, 120, 20, 'unidad'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'BUJ-IR4');

INSERT INTO products (sku, name, description, category_id, brand, price, cost, stock, min_stock, unit)
SELECT 'AMO-RR12', 'Amortiguador trasero Hyundai Accent',
       'Amortiguador de gas. Garantía 24 meses.',
       (SELECT id FROM product_categories WHERE slug = 'suspension-amortiguadores'),
       'KYB',
       72.30, 41.00, 12, 4, 'unidad'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'AMO-RR12');

INSERT INTO products (sku, name, description, category_id, brand, price, cost, stock, min_stock, unit)
SELECT 'FIL-AC09', 'Filtro de aceite Toyota Hilux 2.4D',
       'Filtro estándar OEM-spec.',
       (SELECT id FROM product_categories WHERE slug = 'filtros'),
       'Mann-Filter',
       8.75, 4.20, 200, 30, 'unidad'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'FIL-AC09');

COMMIT;
