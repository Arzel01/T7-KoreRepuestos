import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGarageFields1781137369801 implements MigrationInterface {
  name = 'AddGarageFields1781137369801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.vehiculos_usuario
        ADD COLUMN IF NOT EXISTS kilometraje_diario_promedio integer NOT NULL DEFAULT 20
    `);

    await queryRunner.query(`
      ALTER TABLE public.tareas_mantenimiento
        ADD COLUMN IF NOT EXISTS intervalo_meses integer
    `);

    await queryRunner.query(`
      ALTER TABLE public.tareas_mantenimiento
        ADD COLUMN IF NOT EXISTS es_critica boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.tareas_mantenimiento
        DROP COLUMN IF EXISTS es_critica
    `);
    await queryRunner.query(`
      ALTER TABLE public.tareas_mantenimiento
        DROP COLUMN IF EXISTS intervalo_meses
    `);
    await queryRunner.query(`
      ALTER TABLE public.vehiculos_usuario
        DROP COLUMN IF EXISTS kilometraje_diario_promedio
    `);
  }
}
