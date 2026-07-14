import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompatibilidad1781137369802 implements MigrationInterface {
  name = 'AddCompatibilidad1781137369802';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.compatibilidad (
        id_producto integer NOT NULL REFERENCES public.productos(id_producto) ON DELETE CASCADE,
        id_modelo   integer NOT NULL REFERENCES public.modelos(id_modelo)   ON DELETE CASCADE,
        PRIMARY KEY (id_producto, id_modelo)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_compatibilidad_modelo
        ON public.compatibilidad(id_modelo)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.compatibilidad`);
  }
}
