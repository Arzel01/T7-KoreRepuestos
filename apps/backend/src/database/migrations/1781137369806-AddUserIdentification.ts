import { MigrationInterface, QueryRunner } from 'typeorm';

function getCedulaCheckDigit(base9Digits: string): number {
  const digits = base9Digits.split('').map(Number);
  const sum = digits.reduce((acc, digit, index) => {
    const product = digit * (index % 2 === 0 ? 2 : 1);
    return acc + (product >= 10 ? product - 9 : product);
  }, 0);
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

function buildCedulaFromSeed(seed: number): string {
  const province = String((seed % 24) + 1).padStart(2, '0');
  const middle = String(seed % 1_000_000).padStart(6, '0');
  const base9 = `${province}0${middle}`;
  return `${base9}${getCedulaCheckDigit(base9)}`;
}

export class AddUserIdentification1781137369806 implements MigrationInterface {
  name = 'AddUserIdentification1781137369806';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'tipo_identificacion'
        ) THEN
          CREATE TYPE public.tipo_identificacion AS ENUM ('cedula', 'ruc');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE public.usuarios
        ADD COLUMN IF NOT EXISTS identificacion_personal varchar,
        ADD COLUMN IF NOT EXISTS tipo_identificacion public.tipo_identificacion
    `);

    const users = (await queryRunner.query(
      `SELECT id_usuario FROM public.usuarios ORDER BY id_usuario`,
    )) as Array<{ id_usuario: number }>;

    for (const user of users) {
      await queryRunner.query(
        `UPDATE public.usuarios
            SET identificacion_personal = $1,
                tipo_identificacion = 'cedula'
          WHERE id_usuario = $2`,
        [buildCedulaFromSeed(user.id_usuario), user.id_usuario],
      );
    }

    await queryRunner.query(`
      ALTER TABLE public.usuarios
        ALTER COLUMN identificacion_personal SET NOT NULL,
        ALTER COLUMN tipo_identificacion SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.usuarios
        DROP COLUMN IF EXISTS tipo_identificacion,
        DROP COLUMN IF EXISTS identificacion_personal
    `);
  }
}
