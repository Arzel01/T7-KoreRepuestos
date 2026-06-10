import * as path from 'path';

import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { DataSource, type DataSourceOptions } from 'typeorm';

import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

// __dirname es estable (directorio del archivo) independientemente del cwd del proceso.
// process.cwd() varía según desde dónde se invoque el comando (raíz del monorepo, CI, etc.).
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const buildOptions = (config?: ConfigService): DataSourceOptions => {
  const get = (key: string, fallback?: string): string =>
    config?.get<string>(key) ?? process.env[key] ?? fallback ?? '';

  const entitiesPath = path.join(__dirname, '..', '**', '*.entity.{ts,js}');
  const migrationsPath = path.join(__dirname, '..', 'database', 'migrations', '*.{ts,js}');
  const logging = get('DB_LOGGING', 'false') === 'true';

  // DB_SSL_REJECT_UNAUTHORIZED=true (default) valida el certificado del servidor.
  // Cambiar a false solo en entornos sin ca-certificates actualizados (ej. Alpine antiguo).
  const rejectUnauthorized = get('DB_SSL_REJECT_UNAUTHORIZED', 'true') !== 'false';

  const databaseUrl = get('DATABASE_URL');
  if (databaseUrl) {
    // Supabase: siempre Direct Connection (puerto 5432) para TypeORM.
    // Transaction Mode (6543) no soporta prepared statements.
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [entitiesPath],
      migrations: [migrationsPath],
      synchronize: false,
      logging,
      ssl: { rejectUnauthorized },
    };
  }

  // Fallback: desarrollo local sin Supabase (variables individuales).
  return {
    type: 'postgres',
    host: get('DB_HOST', 'localhost'),
    port: Number(get('DB_PORT', '5432')),
    username: get('DB_USERNAME', 'kore_user'),
    password: get('DB_PASSWORD', 'kore_password'),
    database: get('DB_NAME', 'kore_repuestos'),
    entities: [entitiesPath],
    migrations: [migrationsPath],
    synchronize: get('DB_SYNCHRONIZE', 'false') === 'true',
    logging,
    ssl: get('DB_SSL', 'false') === 'true' ? { rejectUnauthorized } : false,
  };
};

/** Factory para inyectar la configuración en `TypeOrmModule.forRootAsync`. */
export const typeOrmConfigFactory = (config: ConfigService): TypeOrmModuleOptions =>
  buildOptions(config);

/** DataSource exportado para la CLI de TypeORM (migraciones). */
export default new DataSource(buildOptions());
