-- =============================================================================
-- Kore Repuestos · Migración 002 — Tabla sessions
-- -----------------------------------------------------------------------------
-- Soporta el flujo de refresh tokens del módulo `auth`:
--   · Una fila por sesión activa (un login = una fila).
--   · Guardamos un HASH del refresh token, nunca el token plano.
--   · Permite revocar sesiones individualmente (logout) o todas para un
--     usuario (cambio de contraseña, intento de uso indebido, etc.).
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS sessions (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Hash hexadecimal (sha256) → 64 chars; reservamos 128 por holgura.
    refresh_token_hash  VARCHAR(128) NOT NULL UNIQUE,
    user_agent          TEXT,
    -- IPv4 + IPv6 caben en 45 chars (RFC 4291).
    ip_address          VARCHAR(45),
    expires_at          TIMESTAMPTZ  NOT NULL,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
-- Lookup rápido por hash (ya cubierto por el UNIQUE, redundante pero explícito).
CREATE INDEX IF NOT EXISTS idx_sessions_hash       ON sessions(refresh_token_hash);

COMMIT;
