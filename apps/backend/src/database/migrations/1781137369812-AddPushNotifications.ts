import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Web Push (ADR-0006): añade el canal `push` sobre la arquitectura de
 * notificaciones existente (ADR-0002) — sin cambios al outbox ni al
 * despachador, solo el almacén de suscripciones del navegador y la
 * preferencia por usuario.
 */
export class AddPushNotifications1781137369812 implements MigrationInterface {
  name = 'AddPushNotifications1781137369812';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.preferencias_notificacion
        ADD COLUMN IF NOT EXISTS canal_push boolean NOT NULL DEFAULT FALSE
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.suscripciones_push (
        id_suscripcion serial PRIMARY KEY,
        id_usuario     integer NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
        endpoint       text NOT NULL UNIQUE,
        p256dh         varchar(255) NOT NULL,
        auth           varchar(255) NOT NULL,
        creado_en      timestamp NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_suscripciones_push_usuario
        ON public.suscripciones_push (id_usuario)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.suscripciones_push`);
    await queryRunner.query(`
      ALTER TABLE public.preferencias_notificacion DROP COLUMN IF EXISTS canal_push
    `);
  }
}
