import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * US#2 — Recordatorios escalonados por kilometraje (1000 km / 100 km /
 * vencido) además del disparador por fecha. Cada tramo de urgencia se guarda
 * con su propio `tipo` (`recordatorio_mantenimiento_proximo` /
 * `_urgente` / `_vencido`), así que el índice único parcial de idempotencia
 * debe incluir `tipo`: si no, el tramo "urgente" (100 km) no podría
 * encolarse mientras el tramo "próximo" (1000 km) de la misma tarea siga
 * pendiente sin despachar.
 */
export class WidenNotificationDedupeIndex1781137369815 implements MigrationInterface {
  name = 'WidenNotificationDedupeIndex1781137369815';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS uq_notificaciones_pendiente_tarea
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_notificaciones_pendiente_tarea
        ON public.notificaciones (id_vehiculo_usuario, id_tarea, canal, tipo)
        WHERE estado = 'pendiente'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS uq_notificaciones_pendiente_tarea
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_notificaciones_pendiente_tarea
        ON public.notificaciones (id_vehiculo_usuario, id_tarea, canal)
        WHERE estado = 'pendiente'
    `);
  }
}
