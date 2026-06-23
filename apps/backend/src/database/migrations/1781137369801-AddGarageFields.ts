import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea las tablas del módulo Garaje si no existen (idempotente para CI y Supabase)
 * y añade las columnas nuevas a tablas que ya pueden existir en producción.
 */
export class AddGarageFields1781137369801 implements MigrationInterface {
  name = 'AddGarageFields1781137369801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.marcas (
        id_marca  serial PRIMARY KEY,
        nombre    varchar(100) NOT NULL UNIQUE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.categorias_vehiculo (
        id_categoria_vehiculo  serial PRIMARY KEY,
        nombre                 varchar(100) NOT NULL UNIQUE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.modelos (
        id_modelo              serial PRIMARY KEY,
        id_marca               integer NOT NULL REFERENCES public.marcas(id_marca),
        id_categoria_vehiculo  integer REFERENCES public.categorias_vehiculo(id_categoria_vehiculo),
        nombre                 varchar(150) NOT NULL,
        anio_inicio            integer,
        anio_fin               integer
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.vehiculos_usuario (
        id_vehiculo_usuario          serial PRIMARY KEY,
        id_usuario                   integer NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
        id_modelo                    integer NOT NULL REFERENCES public.modelos(id_modelo),
        alias                        varchar(100),
        anio                         integer NOT NULL,
        placa                        varchar(20) UNIQUE,
        kilometraje_actual           integer NOT NULL DEFAULT 0 CHECK (kilometraje_actual >= 0),
        kilometraje_diario_promedio  integer NOT NULL DEFAULT 20,
        creado_en                    timestamp DEFAULT NOW()
      )
    `);

    // Para Supabase: la tabla ya existía sin esta columna
    await queryRunner.query(`
      ALTER TABLE public.vehiculos_usuario
        ADD COLUMN IF NOT EXISTS kilometraje_diario_promedio integer NOT NULL DEFAULT 20
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.guias_mantenimiento (
        id_guia     serial PRIMARY KEY,
        id_modelo   integer NOT NULL REFERENCES public.modelos(id_modelo) ON DELETE CASCADE,
        descripcion text
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.tareas_mantenimiento (
        id_tarea              serial PRIMARY KEY,
        id_guia               integer NOT NULL REFERENCES public.guias_mantenimiento(id_guia) ON DELETE CASCADE,
        descripcion_tarea     varchar(255) NOT NULL,
        intervalo_kilometraje integer NOT NULL CHECK (intervalo_kilometraje > 0),
        intervalo_meses       integer,
        es_critica            boolean NOT NULL DEFAULT false
      )
    `);

    // Para Supabase: la tabla ya existía sin estas columnas
    await queryRunner.query(`
      ALTER TABLE public.tareas_mantenimiento
        ADD COLUMN IF NOT EXISTS intervalo_meses integer
    `);

    await queryRunner.query(`
      ALTER TABLE public.tareas_mantenimiento
        ADD COLUMN IF NOT EXISTS es_critica boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.historial_mantenimiento (
        id_historial         serial PRIMARY KEY,
        id_vehiculo_usuario  integer NOT NULL REFERENCES public.vehiculos_usuario(id_vehiculo_usuario) ON DELETE CASCADE,
        id_tarea             integer REFERENCES public.tareas_mantenimiento(id_tarea) ON DELETE SET NULL,
        fecha_servicio       date NOT NULL,
        kilometraje_servicio integer NOT NULL CHECK (kilometraje_servicio >= 0),
        comentarios          text
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.productos_tarea (
        id_tarea    integer NOT NULL REFERENCES public.tareas_mantenimiento(id_tarea) ON DELETE CASCADE,
        id_producto integer NOT NULL REFERENCES public.productos(id_producto) ON DELETE CASCADE,
        cantidad    integer NOT NULL DEFAULT 1 CHECK (cantidad > 0),
        PRIMARY KEY (id_tarea, id_producto)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.productos_tarea`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.historial_mantenimiento`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.tareas_mantenimiento`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.guias_mantenimiento`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.vehiculos_usuario`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.modelos`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.categorias_vehiculo`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.marcas`);
  }
}
