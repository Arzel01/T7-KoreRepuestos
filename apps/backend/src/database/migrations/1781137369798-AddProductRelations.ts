import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea las tablas de sub-recursos de productos que aún no existen en el schema.
 * Idempotente — usa IF NOT EXISTS para que sea seguro ejecutar en Supabase y CI.
 */
export class AddProductRelations1781137369798 implements MigrationInterface {
  name = 'AddProductRelations1781137369798';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.logs_auditoria (
        id_log             serial PRIMARY KEY,
        id_usuario         integer REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
        tabla_afectada     varchar(100) NOT NULL,
        accion             varchar(20)  NOT NULL
                             CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
        descripcion_cambio text,
        fecha_cambio       timestamp DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_auditoria_tabla
        ON public.logs_auditoria(tabla_afectada)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_auditoria_usuario
        ON public.logs_auditoria(id_usuario)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.imagenes_producto (
        id_imagen    serial PRIMARY KEY,
        id_producto  integer NOT NULL
                       REFERENCES public.productos(id_producto) ON DELETE CASCADE,
        url_imagen   varchar(500) NOT NULL,
        es_principal boolean NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_imagenes_producto
        ON public.imagenes_producto(id_producto)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.fichas_tecnicas (
        id_ficha    serial PRIMARY KEY,
        id_producto integer NOT NULL
                      REFERENCES public.productos(id_producto) ON DELETE CASCADE,
        atributo    varchar(200) NOT NULL,
        valor       varchar(500) NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_fichas_producto
        ON public.fichas_tecnicas(id_producto)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.fichas_tecnicas`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.imagenes_producto`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.logs_auditoria`);
  }
}
