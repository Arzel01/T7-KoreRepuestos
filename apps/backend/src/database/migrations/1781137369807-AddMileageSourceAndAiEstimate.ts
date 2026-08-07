import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMileageSourceAndAiEstimate1781137369807 implements MigrationInterface {
  name = 'AddMileageSourceAndAiEstimate1781137369807';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.vehiculos_usuario
        ADD COLUMN IF NOT EXISTS kilometraje_estimado_ia integer,
        ADD COLUMN IF NOT EXISTS fuente_ultimo_kilometraje varchar(20) NOT NULL DEFAULT 'USUARIO'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.vehiculos_usuario
        DROP COLUMN IF EXISTS fuente_ultimo_kilometraje,
        DROP COLUMN IF EXISTS kilometraje_estimado_ia
    `);
  }
}
