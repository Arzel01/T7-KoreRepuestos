import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fix — registro roto en producción (500 en `POST /auth/register`).
 *
 * `usuarios.identificacion_personal` (cédula/RUC) y `usuarios.tipo_identificacion`
 * son `NOT NULL` en la base real, pero ninguna migración de este repo los crea:
 * son drift de esquema — probablemente de una versión anterior del registro que
 * capturaba la identificación del cliente (habitual para facturación en Ecuador,
 * ver NFR 3.6) y que se perdió del código actual (`User` entity/`CreateUserDto`)
 * sin revertir la columna. Los 10 usuarios existentes SÍ tienen el dato cargado
 * — no se toca ni se borra nada, solo se relaja el NOT NULL para que un alta
 * nueva (que hoy no envía estos campos) no reviente con un 500.
 *
 * Restaurar la captura de cédula/RUC en el registro es una feature aparte
 * (formulario + validación de formato) — ver docs/testing/../acceptance report.
 */
export class RelaxUsuariosIdentificacion1781137369813 implements MigrationInterface {
  name = 'RelaxUsuariosIdentificacion1781137369813';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Las columnas no existen en un esquema construido solo desde las
    // migraciones de este repo (p. ej. el Postgres efímero de CI) — solo en
    // la base real con el drift descrito arriba. DO block condicional para
    // que la migración sea un no-op segura donde no aplica.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'usuarios'
            AND column_name = 'identificacion_personal'
        ) THEN
          ALTER TABLE public.usuarios ALTER COLUMN identificacion_personal DROP NOT NULL;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'usuarios'
            AND column_name = 'tipo_identificacion'
        ) THEN
          ALTER TABLE public.usuarios ALTER COLUMN tipo_identificacion DROP NOT NULL;
        END IF;
      END $$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No reversible sin datos: un rollback con filas NULL existentes violaría
    // el NOT NULL de nuevo. No se restaura automáticamente.
  }
}
