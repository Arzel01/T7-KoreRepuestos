import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración de bootstrap.
 *
 * En Supabase las tablas del negocio ya existen (schema real en español);
 * el `CREATE TABLE IF NOT EXISTS` las deja intactas.
 *
 * En el Postgres efímero de CI (e2e) esta migración crea el schema completo
 * que necesita el backend: usuarios, categorias, productos y sesiones.
 */
export class InitialSchema1781137369796 implements MigrationInterface {
  name = 'InitialSchema1781137369796';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Extensiones (idempotentes) ──────────────────────────────────────
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);

    // Limpiar tipo residual de la migración antigua si quedó en la BD
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);

    // ── Tablas del schema real ──────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.usuarios (
        id_usuario     serial PRIMARY KEY,
        rol            varchar NOT NULL DEFAULT 'Cliente'
                         CHECK (rol IN ('Administrador', 'Asesor Comercial', 'Cliente')),
        email          varchar NOT NULL UNIQUE,
        password_hash  varchar NOT NULL,
        nombres        varchar NOT NULL,
        telefono       varchar,
        direccion      text,
        is_active      boolean NOT NULL DEFAULT true,
        creado_en      timestamp DEFAULT NOW(),
        actualizado_en timestamp DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.categorias (
        id_categoria        serial PRIMARY KEY,
        id_categoria_padre  integer
                              REFERENCES public.categorias(id_categoria) ON DELETE CASCADE,
        nombre              varchar(120) NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.productos (
        id_producto   serial PRIMARY KEY,
        sku           varchar NOT NULL UNIQUE,
        nombre        varchar(200) NOT NULL,
        descripcion   text,
        precio_base   numeric(12,2) NOT NULL CHECK (precio_base >= 0),
        stock_actual  integer NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
        is_active     boolean DEFAULT true,
        id_categoria  integer
                        REFERENCES public.categorias(id_categoria) ON DELETE SET NULL,
        creado_en     timestamp DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.sesiones (
        id_sesion           serial PRIMARY KEY,
        id_usuario          integer NOT NULL
                              REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
        refresh_token_hash  varchar NOT NULL,
        user_agent          text,
        ip_address          varchar,
        expires_at          timestamp NOT NULL,
        revoked_at          timestamp,
        created_at          timestamp DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sesiones_refresh_hash
        ON public.sesiones(refresh_token_hash)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sesiones_id_usuario
        ON public.sesiones(id_usuario)
    `);

    // Añadir is_active a usuarios si ya existía sin esa columna (Supabase real)
    await queryRunner.query(`
      ALTER TABLE public.usuarios
        ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS public.idx_sesiones_id_usuario`);
    await queryRunner.query(`DROP INDEX IF EXISTS public.idx_sesiones_refresh_hash`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.sesiones`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.productos`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.categorias`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.usuarios`);
  }
}
