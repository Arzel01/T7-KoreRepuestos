import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * US#2 — Recordatorios de mantenimiento (arquitectura Postgres, ver ADR-0002).
 *
 * - `preferencias_notificacion`: ajustes por usuario (canales + anticipación).
 * - `notificaciones`: modelo de recordatorio **y** outbox/cola. El despachador
 *   toma las filas `pendiente` (índice parcial) y las entrega por su canal.
 *   Un índice único parcial evita re-encolar el mismo recordatorio pendiente
 *   para el mismo (vehículo, tarea, canal).
 */
export class AddNotifications1781137369809 implements MigrationInterface {
  name = 'AddNotifications1781137369809';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.preferencias_notificacion (
        id_preferencia        serial PRIMARY KEY,
        id_usuario            integer NOT NULL UNIQUE REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
        recordatorios_activos boolean NOT NULL DEFAULT TRUE,
        canal_email           boolean NOT NULL DEFAULT TRUE,
        canal_app             boolean NOT NULL DEFAULT TRUE,
        dias_anticipacion     integer NOT NULL DEFAULT 7,
        creado_en             timestamp NOT NULL DEFAULT NOW(),
        actualizado_en        timestamp NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.notificaciones (
        id_notificacion     serial PRIMARY KEY,
        id_usuario          integer NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
        id_vehiculo_usuario integer REFERENCES public.vehiculos_usuario(id_vehiculo_usuario) ON DELETE CASCADE,
        id_tarea            integer REFERENCES public.tareas_mantenimiento(id_tarea) ON DELETE SET NULL,
        tipo                varchar(50) NOT NULL DEFAULT 'recordatorio_mantenimiento',
        titulo              varchar(160) NOT NULL,
        mensaje             text NOT NULL,
        canal               varchar(10) NOT NULL DEFAULT 'app',
        estado              varchar(12) NOT NULL DEFAULT 'pendiente',
        programada_para     timestamp NOT NULL DEFAULT NOW(),
        enviada_en          timestamp,
        leida_en            timestamp,
        creado_en           timestamp NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario
        ON public.notificaciones (id_usuario, creado_en DESC)
    `);

    // Cola: acelera el barrido del despachador sobre las pendientes vencidas.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notificaciones_pendientes
        ON public.notificaciones (programada_para)
        WHERE estado = 'pendiente'
    `);

    // Idempotencia: un solo recordatorio pendiente por (vehículo, tarea, canal).
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_notificaciones_pendiente_tarea
        ON public.notificaciones (id_vehiculo_usuario, id_tarea, canal)
        WHERE estado = 'pendiente'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.notificaciones`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.preferencias_notificacion`);
  }
}
