import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductSearchVector1781137369803 implements MigrationInterface {
  name = 'AddProductSearchVector1781137369803';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.productos
        ADD COLUMN IF NOT EXISTS search_vector tsvector
          GENERATED ALWAYS AS (
            setweight(to_tsvector('spanish', coalesce(nombre, '')), 'A') ||
            setweight(to_tsvector('simple',  coalesce(sku, '')),    'A') ||
            setweight(to_tsvector('spanish', coalesce(descripcion, '')), 'B')
          ) STORED
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_productos_search_vector
        ON public.productos USING GIN (search_vector)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_productos_nombre_trgm
        ON public.productos USING GIN (nombre gin_trgm_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_productos_nombre_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_productos_search_vector`);
    await queryRunner.query(`
      ALTER TABLE public.productos DROP COLUMN IF EXISTS search_vector
    `);
  }
}
