import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropResenasTable1781137369814 implements MigrationInterface {
  name = 'DropResenasTable1781137369814';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Both tables existed with data. resenas (no ñ) is the orphaned duplicate;
    // reseñas (with ñ) is the canonical table used by all backend code.
    // Strategy: migrate rows from resenas → reseñas, skipping conflicts
    // (when both tables have a review for the same product+user, keep reseñas
    // since it may have the richer titulo/votos_util data).
    await queryRunner.query(`
      INSERT INTO public."reseñas"
        (id_producto, id_usuario, calificacion, comentario, creado_en)
      SELECT
        r.id_producto,
        r.id_usuario,
        r.calificacion::integer,
        r.comentario,
        r.creado_en
      FROM public.resenas r
      WHERE EXISTS (SELECT 1 FROM public.productos WHERE id_producto = r.id_producto)
        AND EXISTS (SELECT 1 FROM public.usuarios  WHERE id_usuario  = r.id_usuario)
      ON CONFLICT (id_producto, id_usuario) DO NOTHING
    `);

    await queryRunner.query(`DROP TABLE public.resenas CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.resenas (
        id_resena    serial PRIMARY KEY,
        id_producto  integer NOT NULL REFERENCES public.productos(id_producto),
        id_usuario   integer NOT NULL REFERENCES public.usuarios(id_usuario),
        calificacion smallint NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
        comentario   text NOT NULL,
        creado_en    timestamp DEFAULT now()
      )
    `);
  }
}
