import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Módulo 4 — Cotizaciones (US#22 · Sprint 8).
 *
 * Crea `cotizaciones` (cabecera) y `detalle_cotizacion` (líneas). Igual que el
 * resto del schema (ver [[project_real_db_schema]]), es idempotente
 * (IF NOT EXISTS) para convivir con Supabase —que ya podría tener estas
 * tablas— y con el Postgres efímero de CI que arranca vacío.
 *
 * `precio_unitario` congela el precio del producto al emitir la cotización; el
 * correlativo `numero_cotizacion` es UNIQUE y lo genera el servicio a partir
 * del id recién insertado dentro de una transacción.
 */
export class AddQuotations1781137369811 implements MigrationInterface {
  name = 'AddQuotations1781137369811';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.cotizaciones (
        id_cotizacion     serial PRIMARY KEY,
        numero_cotizacion varchar(32) NOT NULL UNIQUE,
        id_usuario        integer NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
        fecha_emision     timestamp NOT NULL DEFAULT NOW(),
        fecha_validez     timestamp NOT NULL,
        estado            varchar(20) NOT NULL DEFAULT 'Pendiente'
      )
    `);

    // Supabase podría tener la tabla sin el correlativo o el estado.
    await queryRunner.query(`
      ALTER TABLE public.cotizaciones
        ADD COLUMN IF NOT EXISTS numero_cotizacion varchar(32)
    `);
    await queryRunner.query(`
      ALTER TABLE public.cotizaciones
        ADD COLUMN IF NOT EXISTS estado varchar(20) NOT NULL DEFAULT 'Pendiente'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_usuario
        ON public.cotizaciones (id_usuario)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.detalle_cotizacion (
        id_detalle      serial PRIMARY KEY,
        id_cotizacion   integer NOT NULL REFERENCES public.cotizaciones(id_cotizacion) ON DELETE CASCADE,
        id_producto     integer NOT NULL REFERENCES public.productos(id_producto) ON DELETE RESTRICT,
        cantidad        integer NOT NULL CHECK (cantidad > 0),
        precio_unitario numeric(12, 2) NOT NULL CHECK (precio_unitario >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_detalle_cotizacion_cotizacion
        ON public.detalle_cotizacion (id_cotizacion)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.detalle_cotizacion`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.cotizaciones`);
  }
}
