import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Garantiza que el schema del backend está completo:
 *  • Crea las tablas reales (IF NOT EXISTS) para el Postgres efímero de CI.
 *  • Añade is_active a usuarios (ADD COLUMN IF NOT EXISTS) para Supabase,
 *    donde la tabla ya existía pero sin esa columna.
 *
 * Idempotente — seguro de ejecutar en cualquier entorno.
 */
export class AddIsActiveAndRealSchema1781137369797 implements MigrationInterface {
  name = 'AddIsActiveAndRealSchema1781137369797';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensiones (idempotentes)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);

    // Tabla usuarios — crea en CI, no-op en Supabase (ya existe)
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
        creado_en      timestamp DEFAULT NOW(),
        actualizado_en timestamp DEFAULT NOW()
      )
    `);

    // is_active — añade en Supabase donde no existe; no-op si ya está
    await queryRunner.query(`
      ALTER TABLE public.usuarios
        ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true
    `);

    // Tabla categorias
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.categorias (
        id_categoria        serial PRIMARY KEY,
        id_categoria_padre  integer
                              REFERENCES public.categorias(id_categoria) ON DELETE CASCADE,
        nombre              varchar(120) NOT NULL
      )
    `);

    // Tabla productos
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

    // Tabla sesiones
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE public.usuarios DROP COLUMN IF EXISTS is_active`);
  }
}
