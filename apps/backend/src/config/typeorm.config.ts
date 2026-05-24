import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, type DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const buildOptions = (config?: ConfigService): DataSourceOptions => {
  const get = (key: string, fallback?: string): string =>
    config?.get<string>(key) ?? process.env[key] ?? fallback ?? '';

  return {
    type: 'postgres',
    host: get('DB_HOST', 'localhost'),
    port: Number(get('DB_PORT', '5432')),
    username: get('DB_USERNAME', 'kore_user'),
    password: get('DB_PASSWORD', 'kore_password'),
    database: get('DB_NAME', 'kore_repuestos'),
    entities: [path.join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [path.join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
    synchronize: get('DB_SYNCHRONIZE', 'false') === 'true',
    logging: get('DB_LOGGING', 'false') === 'true',
    ssl: get('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
  };
};

/** Factory para inyectar la configuración en `TypeOrmModule.forRootAsync`. */
export const typeOrmConfigFactory = (
  config: ConfigService,
): TypeOrmModuleOptions => buildOptions(config);

/** DataSource exportado para la CLI de TypeORM (migraciones). */
export default new DataSource(buildOptions());
