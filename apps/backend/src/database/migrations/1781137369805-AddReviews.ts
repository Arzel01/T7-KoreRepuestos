import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviews1781137369805 implements MigrationInterface {
  name = 'AddReviews1781137369805';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public."reseñas" (
        "id_reseña"   serial PRIMARY KEY,
        id_producto   integer NOT NULL REFERENCES public.productos(id_producto) ON DELETE CASCADE,
        id_usuario    integer NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
        calificacion  integer NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
        titulo        varchar(200),
        comentario    text,
        votos_util    integer NOT NULL DEFAULT 0,
        creado_en     timestamp NOT NULL DEFAULT NOW(),
        UNIQUE (id_producto, id_usuario)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_reseñas_producto" ON public."reseñas" (id_producto)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_reseñas_usuario" ON public."reseñas" (id_usuario)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public."reseñas"`);
  }
}
