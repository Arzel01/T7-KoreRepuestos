import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sinónimos del dominio automotriz para expandir la búsqueda del catálogo.
 *
 * Resuelve la limitación anotada en ADR-0001 ("no hay soporte nativo de
 * sinónimos del dominio, ej. pastillas = balatas") sin introducir Elasticsearch:
 * los pares se almacenan aquí y `SynonymsService` los expande (cierre transitivo)
 * al construir la query en `products.repository.ts`.
 *
 * Los pares son bidireccionales y se encadenan a propósito (llanta↔neumático,
 * neumático↔goma, …) para que el BFS del servicio agrupe todas las variantes.
 */
export class AddSinonimos1781137369806 implements MigrationInterface {
  name = 'AddSinonimos1781137369806';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.sinonimos (
        id_sinonimo serial PRIMARY KEY,
        termino     varchar(100) NOT NULL,
        sinonimo    varchar(100) NOT NULL,
        UNIQUE (termino, sinonimo)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sinonimos_termino ON public.sinonimos (lower(termino))
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sinonimos_sinonimo ON public.sinonimos (lower(sinonimo))
    `);

    // Pares base (español LatAm). Se guardan en minúsculas; el servicio
    // normaliza igualmente. ON CONFLICT los hace idempotentes.
    await queryRunner.query(`
      INSERT INTO public.sinonimos (termino, sinonimo) VALUES
        ('pastillas', 'balatas'),
        ('pastilla', 'balata'),
        ('disco', 'rotor'),
        ('bujia', 'candela'),
        ('llanta', 'neumatico'),
        ('neumatico', 'goma'),
        ('goma', 'caucho'),
        ('bateria', 'acumulador'),
        ('acumulador', 'pila'),
        ('parabrisas', 'cristal'),
        ('cristal', 'luna'),
        ('limpiaparabrisas', 'plumillas'),
        ('plumillas', 'plumas'),
        ('silenciador', 'mofle'),
        ('mofle', 'escape'),
        ('embrague', 'clutch'),
        ('clutch', 'croche'),
        ('retrovisor', 'espejo'),
        ('amortiguador', 'shock'),
        ('radiador', 'panal'),
        ('correa', 'banda'),
        ('foco', 'bombillo'),
        ('bombillo', 'ampolleta')
      ON CONFLICT (termino, sinonimo) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.sinonimos`);
  }
}
