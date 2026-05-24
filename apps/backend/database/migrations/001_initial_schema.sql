-- =============================================================================
-- Kore Repuestos · Migración 001 — Esquema inicial (Sprint 1)
-- -----------------------------------------------------------------------------
-- Esta migración recrea el esquema base que también vive en
-- `docker/postgres/init.sql`. La diferencia es que `init.sql` SOLO se ejecuta
-- la primera vez que arranca el contenedor (BD vacía). Para entornos donde el
-- volumen ya existe o para producción se aplica esta migración manualmente:
--
--   psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME \
--        -f apps/backend/database/migrations/001_initial_schema.sql
--
-- O bien con `npm run migration:run` (TypeORM) si se prefiere el camino ORM.
--
-- Idempotente: usa IF NOT EXISTS en todas las creaciones.
-- =============================================================================

BEGIN;

-- 1. Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- emails case-insensitive
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- búsqueda por similitud

-- 2. Tipo enumerado para roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'cliente', 'asesor');
    END IF;
END$$;

-- 3. Trigger genérico para updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Tabla users -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email             CITEXT       NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    first_name        VARCHAR(100) NOT NULL,
    last_name         VARCHAR(100) NOT NULL,
    phone             VARCHAR(30),
    role              user_role    NOT NULL DEFAULT 'cliente',
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    email_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    last_login_at     TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Tabla product_categories (auto-referencia jerárquica) -------------------
CREATE TABLE IF NOT EXISTS product_categories (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id    UUID         REFERENCES product_categories(id) ON DELETE CASCADE,
    name         VARCHAR(120) NOT NULL,
    slug         VARCHAR(140) NOT NULL UNIQUE,
    description  TEXT,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_slug   ON product_categories(slug);

DROP TRIGGER IF EXISTS trg_product_categories_updated_at ON product_categories;
CREATE TRIGGER trg_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. Tabla products ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    sku           VARCHAR(64)   NOT NULL UNIQUE,
    name          VARCHAR(200)  NOT NULL,
    description   TEXT,
    category_id   UUID          REFERENCES product_categories(id) ON DELETE SET NULL,
    brand         VARCHAR(120),
    -- price > 0  ↔  regla US#45: no aceptamos productos con precio cero.
    price         NUMERIC(12,2) NOT NULL CHECK (price > 0),
    cost          NUMERIC(12,2)              CHECK (cost  > 0),
    -- stock >= 0 a nivel BD (un producto puede agotarse), pero la API exige
    -- stock > 0 al crear. Esto es defensa en profundidad: la BD acepta los
    -- decrementos por venta sin necesidad de soltar la constraint.
    stock         INTEGER       NOT NULL DEFAULT 0  CHECK (stock >= 0),
    min_stock     INTEGER       NOT NULL DEFAULT 0  CHECK (min_stock >= 0),
    unit          VARCHAR(30)   NOT NULL DEFAULT 'unidad',
    image_url     VARCHAR(500),
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_products_sku       ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand     ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_active    ON products(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
