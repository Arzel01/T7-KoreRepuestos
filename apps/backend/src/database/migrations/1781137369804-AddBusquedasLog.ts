import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusquedasLog1781137369804 implements MigrationInterface {
  name = 'AddBusquedasLog1781137369804';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.busquedas_log (
        id_busqueda          serial PRIMARY KEY,
        termino              varchar(200) NOT NULL,
        cantidad_resultados  integer NOT NULL DEFAULT 0,
        id_usuario           integer REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
        creado_en            timestamp NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_busquedas_log_termino
        ON public.busquedas_log (lower(termino))
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_busquedas_log_fecha
        ON public.busquedas_log (creado_en)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.busquedas_log`);
  }
}
