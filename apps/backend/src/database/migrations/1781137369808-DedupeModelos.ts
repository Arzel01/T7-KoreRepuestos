import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Arreglo de raíz del band-aid documentado en `vehicles.service.ts`:
 * la tabla `modelos` tiene filas duplicadas (mismo id_marca + nombre) porque
 * le faltaba un UNIQUE. Esta migración:
 *   1. Elige la fila superviviente por grupo (menor id_modelo).
 *   2. Repunta las FKs (compatibilidad, vehiculos_usuario, guias_mantenimiento)
 *      de los duplicados hacia el superviviente.
 *   3. Borra los duplicados y añade UNIQUE (id_marca, nombre).
 *
 * Tras esto, `listModelsByBrand` puede volver a un `find` simple sin DISTINCT ON.
 */
export class DedupeModelos1781137369808 implements MigrationInterface {
  name = 'DedupeModelos1781137369808';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Mapa duplicado→superviviente (agrupa por marca + nombre insensible a mayúsculas).
    await queryRunner.query(`
      CREATE TEMP TABLE _modelo_dupes ON COMMIT DROP AS
        SELECT id_modelo AS dup_id,
               MIN(id_modelo) OVER (PARTITION BY id_marca, lower(nombre)) AS keep_id
        FROM public.modelos
    `);
    await queryRunner.query(`DELETE FROM _modelo_dupes WHERE dup_id = keep_id`);

    // Repunta compatibilidad, evitando colisión con la PK (id_producto, id_modelo).
    await queryRunner.query(`
      UPDATE public.compatibilidad c
         SET id_modelo = d.keep_id
        FROM _modelo_dupes d
       WHERE c.id_modelo = d.dup_id
         AND NOT EXISTS (
           SELECT 1 FROM public.compatibilidad c2
            WHERE c2.id_producto = c.id_producto AND c2.id_modelo = d.keep_id
         )
    `);
    // Elimina las filas de compatibilidad que aún apuntan a un duplicado
    // (porque el superviviente ya tenía esa combinación).
    await queryRunner.query(`
      DELETE FROM public.compatibilidad c
       USING _modelo_dupes d
       WHERE c.id_modelo = d.dup_id
    `);

    // Repunta vehículos de usuarios y guías de mantenimiento (sin unique en id_modelo).
    await queryRunner.query(`
      UPDATE public.vehiculos_usuario v
         SET id_modelo = d.keep_id
        FROM _modelo_dupes d
       WHERE v.id_modelo = d.dup_id
    `);
    await queryRunner.query(`
      UPDATE public.guias_mantenimiento g
         SET id_modelo = d.keep_id
        FROM _modelo_dupes d
       WHERE g.id_modelo = d.dup_id
    `);

    // Borra los duplicados ya sin referencias.
    await queryRunner.query(`
      DELETE FROM public.modelos m
       USING _modelo_dupes d
       WHERE m.id_modelo = d.dup_id
    `);

    // Añade el UNIQUE que faltaba (idempotente ante reejecución).
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_modelos_marca_nombre'
        ) THEN
          ALTER TABLE public.modelos
            ADD CONSTRAINT uq_modelos_marca_nombre UNIQUE (id_marca, nombre);
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No se pueden recrear los duplicados; solo se retira la restricción.
    await queryRunner.query(`
      ALTER TABLE public.modelos DROP CONSTRAINT IF EXISTS uq_modelos_marca_nombre
    `);
  }
}
