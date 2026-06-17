-- =============================================================================
-- Kore Repuestos · Seed 001 — Usuario administrador + categorías de prueba
-- -----------------------------------------------------------------------------
-- Pobla la BD con un mínimo viable para empezar a usar el sistema:
--   · 1 usuario admin con credenciales conocidas (cambiar tras primer login).
--   · 5 categorías raíz típicas del rubro de repuestos.
--   · 3 subcategorías para demostrar la jerarquía recursiva (parent_id).
--
-- Idempotente: ON CONFLICT DO NOTHING permite ejecutar el script múltiples
-- veces sin generar duplicados.
--
-- ⚠️  Las credenciales son SOLO PARA DESARROLLO. NUNCA usar en producción.
--    Email:    admin@kore.local
--    Password: ChangeMe123!
--    El hash bcrypt está pre-calculado con `bcrypt.hashSync('ChangeMe123!', 10)`.
--    Regenerar con:
--      node -e "console.log(require('bcrypt').hashSync('ChangeMe123!',10))"
-- =============================================================================

BEGIN;

-- 1. Usuario administrador --------------------------------------------------
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, is_active)
VALUES (
    'admin@kore.local',
    -- bcrypt($2b$, cost=10) de 'ChangeMe123!'
    '$2b$10$8K1p/a0dRJzPxQYjMbB2.eO7vXz3.RbV9G9LcEqKxLqVxQq5n1mFG',
    'Admin',
    'Kore',
    'admin',
    TRUE,
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- 2. Categorías raíz --------------------------------------------------------
INSERT INTO product_categories (name, slug, description) VALUES
    ('Motor',          'motor',          'Componentes del motor y sistema de combustión'),
    ('Frenos',         'frenos',         'Sistema de frenado: pastillas, discos, bombines, ABS'),
    ('Suspensión',     'suspension',     'Amortiguadores, espirales, bujes, terminales'),
    ('Eléctrico',      'electrico',      'Sistema eléctrico: baterías, alternadores, sensores'),
    ('Filtros',        'filtros',        'Filtros de aire, aceite, combustible y cabina'),
    ('Transmisión',    'transmision',    'Cajas, embragues, semiejes, crucetas'),
    ('Carrocería',     'carroceria',     'Paragolpes, paneles, vidrios, manijas')
ON CONFLICT (slug) DO NOTHING;

-- 3. Subcategorías (demostración del árbol recursivo) -----------------------
INSERT INTO product_categories (name, slug, description, parent_id)
SELECT 'Pastillas de freno', 'frenos-pastillas',
       'Pastillas de freno delanteras y traseras', id
FROM product_categories WHERE slug = 'frenos'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_categories (name, slug, description, parent_id)
SELECT 'Discos de freno', 'frenos-discos',
       'Discos ventilados, sólidos y rayados', id
FROM product_categories WHERE slug = 'frenos'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_categories (name, slug, description, parent_id)
SELECT 'Bujías', 'motor-bujias',
       'Bujías de encendido: cobre, platino, iridio', id
FROM product_categories WHERE slug = 'motor'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_categories (name, slug, description, parent_id)
SELECT 'Amortiguadores', 'suspension-amortiguadores',
       'Amortiguadores de gas y aceite, delanteros y traseros', id
FROM product_categories WHERE slug = 'suspension'
ON CONFLICT (slug) DO NOTHING;

COMMIT;
