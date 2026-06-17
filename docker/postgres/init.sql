-- ============================================================================
-- Kore Repuestos — Script de inicialización de base de datos
-- Sprint 0 · Esquema base para autenticación y catálogo de productos
--
-- Este script se ejecuta automáticamente la primera vez que el contenedor
-- de PostgreSQL arranca con un volumen vacío (montado por docker-compose en
-- /docker-entrypoint-initdb.d/). Idempotente — usa IF NOT EXISTS en todo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extensiones requeridas
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid() y hashing
CREATE EXTENSION IF NOT EXISTS "citext";     -- emails case-insensitive
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- búsqueda por similitud en nombres


-- ----------------------------------------------------------------------------
-- 2. ENUM: roles de usuario del sistema
--    Sirve para autorización (admin, cliente, asesor de ventas).
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'cliente', 'asesor');
    END IF;
END$$;


-- ----------------------------------------------------------------------------
-- 3. Función trigger compartida para mantener updated_at automáticamente
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 4. TABLA: users (usuarios del sistema)
--    Lista para autenticación: contiene password_hash y rol.
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role      ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active    ON users(is_active) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 5. TABLA: product_categories (categorías jerárquicas de productos)
--    Auto-referencia parent_id → permite árbol recursivo (CTE WITH RECURSIVE).
-- ============================================================================
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


-- ============================================================================
-- 6. TABLA: products (catálogo de repuestos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    sku           VARCHAR(64)   NOT NULL UNIQUE,
    name          VARCHAR(200)  NOT NULL,
    description   TEXT,
    category_id   UUID          REFERENCES product_categories(id) ON DELETE SET NULL,
    brand         VARCHAR(120),
    price         NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    cost          NUMERIC(12,2)              CHECK (cost  >= 0),
    stock         INTEGER       NOT NULL DEFAULT 0 CHECK (stock     >= 0),
    min_stock     INTEGER       NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
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
-- Búsqueda por similitud (search-as-you-type) sobre nombre
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- 6.b TABLA: sessions (refresh tokens del módulo auth)
--     Una fila por sesión activa. Se guarda el HASH del refresh token,
--     nunca el token plano. Permite revocación granular.
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash  VARCHAR(128) NOT NULL UNIQUE,
    user_agent          TEXT,
    ip_address          VARCHAR(45),
    expires_at          TIMESTAMPTZ  NOT NULL,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_hash       ON sessions(refresh_token_hash);


-- ============================================================================
-- 7. Datos semilla mínimos (solo para entorno local)
--    El primer usuario admin permite acceder al sistema antes de tener un
--    flujo de registro. La contraseña en texto plano es: ChangeMe123!
--    Hash bcrypt regenerable con: node -e "console.log(require('bcrypt').hashSync('ChangeMe123!',10))"
-- ============================================================================
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
VALUES (
    'admin@kore.local',
    '$2b$10$8K1p/a0dRJzPxQYjMbB2.eO7vXz3.RbV9G9LcEqKxLqVxQq5n1mFG',
    'Admin',
    'Kore',
    'admin',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO product_categories (name, slug, description) VALUES
    ('Motor',       'motor',       'Componentes del motor y sistema de combustión'),
    ('Frenos',      'frenos',      'Sistema de frenado y componentes asociados'),
    ('Suspensión',  'suspension',  'Amortiguadores, espirales, bujes'),
    ('Eléctrico',   'electrico',   'Sistema eléctrico, baterías, alternadores'),
    ('Filtros',     'filtros',     'Filtros de aire, aceite, combustible, cabina')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Fin de init.sql — Sprint 0
-- ============================================================================
