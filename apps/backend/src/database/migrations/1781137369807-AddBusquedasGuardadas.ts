import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Búsquedas guardadas por usuario (US#12). Persiste el mismo conjunto de
 * parámetros que el frontend serializa en la URL del catálogo, como jsonb,
 * para poder re-aplicarlos con un clic.
 */
export class AddBusquedasGuardadas1781137369807 implements MigrationInterface {
  name = 'AddBusquedasGuardadas1781137369807';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.busquedas_guardadas (
        id_busqueda_guardada serial PRIMARY KEY,
        id_usuario           integer NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
        nombre               varchar(120) NOT NULL,
        parametros           jsonb NOT NULL DEFAULT '{}'::jsonb,
        creado_en            timestamp NOT NULL DEFAULT NOW(),
        UNIQUE (id_usuario, nombre)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_busquedas_guardadas_usuario
        ON public.busquedas_guardadas (id_usuario)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.busquedas_guardadas`);
  }
}
