import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Añade índice parcial en categorias(id_categoria_padre) para optimizar
 * el CTE recursivo del árbol de categorías con n-niveles.
 * PostgreSQL no indexa FKs automáticamente; sin este índice cada nivel del CTE
 * hace seq scan completo de la tabla.
 */
export class AddCategoryParentIndex1781137369799 implements MigrationInterface {
  name = 'AddCategoryParentIndex1781137369799';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_categorias_padre
        ON public.categorias(id_categoria_padre)
        WHERE id_categoria_padre IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS public.idx_categorias_padre`);
  }
}
