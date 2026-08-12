import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  type HealthCheckResult,
} from '@nestjs/terminus';

import { Public } from '../../common/decorators/public.decorator';

/**
 * Health-check público (3.10 — Confiabilidad). Pensado para un monitor de
 * uptime externo (Uptime Robot, AWS CloudWatch) que hace ping cada pocos
 * minutos: sin JWT, sin dependencias más allá de la conexión a Postgres.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Estado del servicio y su conexión a la base de datos.' })
  @ApiResponse({ status: 200, description: 'Servicio saludable.' })
  @ApiResponse({ status: 503, description: 'Servicio degradado (p. ej. sin conexión a la BD).' })
  check(): Promise<HealthCheckResult> {
    // Timeout por encima del default (1s): Supabase (pooler remoto) puede
    // tardar más que una Postgres local en responder al ping de conexión.
    return this.health.check([() => this.db.pingCheck('database', { timeout: 3000 })]);
  }
}
