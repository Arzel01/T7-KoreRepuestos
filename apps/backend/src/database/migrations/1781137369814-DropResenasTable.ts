import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropResenasTable1781137369814 implements MigrationInterface {
  name = 'DropResenasTable1781137369814';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // resenas (no ñ) was created directly in Supabase, never via a migration.
    // CI starts from a blank DB so the table may not exist — guard with a check.
    const rows: { exists: boolean }[] = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'resenas'
      ) AS exists
    `);
    const exists: boolean = rows[0]?.exists ?? false;

    if (!exists) return;

    // Migrate rows into the canonical reseñas table before dropping.
    // ON CONFLICT keeps the richer reseñas row when both tables share the same
    // (id_producto, id_usuario) pair.
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
