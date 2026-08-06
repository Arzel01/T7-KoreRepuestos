import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Módulo 4 — Carrito de compras (US#18–US#20).
 *
 * Crea `carrito_compras` (un carrito por usuario) e `items_carrito` (líneas).
 * Idempotente (IF NOT EXISTS) para convivir con Supabase, que ya podría tener
 * estas tablas, y con el Postgres efímero de CI que parte vacío. El índice
 * único (id_carrito, id_producto) hace cumplir la prevención de duplicados:
 * una sola línea por producto dentro de un carrito. Ver ADR / [[project_real_db_schema]].
 */
export class AddCart1781137369810 implements MigrationInterface {
  name = 'AddCart1781137369810';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.carrito_compras (
        id_carrito     serial PRIMARY KEY,
        id_usuario     integer NOT NULL UNIQUE REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
        actualizado_en timestamp NOT NULL DEFAULT NOW()
      )
    `);

    // Para Supabase: la tabla podría existir sin la columna de auditoría.
    await queryRunner.query(`
      ALTER TABLE public.carrito_compras
        ADD COLUMN IF NOT EXISTS actualizado_en timestamp NOT NULL DEFAULT NOW()
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.items_carrito (
        id_item     serial PRIMARY KEY,
        id_carrito  integer NOT NULL REFERENCES public.carrito_compras(id_carrito) ON DELETE CASCADE,
        id_producto integer NOT NULL REFERENCES public.productos(id_producto) ON DELETE CASCADE,
        cantidad    integer NOT NULL CHECK (cantidad > 0)
      )
    `);

    // Prevención de duplicados: un producto aparece una sola vez por carrito.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_items_carrito_producto
        ON public.items_carrito (id_carrito, id_producto)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.items_carrito`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.carrito_compras`);
  }
}
