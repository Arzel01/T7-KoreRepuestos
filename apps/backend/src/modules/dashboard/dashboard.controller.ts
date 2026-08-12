import { UserRole } from '@kore/shared';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';

import { DashboardService } from './dashboard.service';
import { SalesTrendQueryDto, TopProductsQueryDto } from './dto/dashboard-query.dto';

import type { DashboardSummaryResponse, SalesTrendPoint, TopProductStat } from '@kore/shared';

/**
 * Indicadores del panel administrativo — datos en vivo, sin agregación
 * pre-calculada. Visible para Administrador y Asesor Comercial (ambos
 * necesitan visibilidad operativa; las mutaciones del catálogo siguen
 * exigiendo Administrador en sus propios controllers).
 */
@ApiTags('dashboard')
@ApiBearerAuth()
@Roles(UserRole.ADMINISTRADOR, UserRole.ASESOR_COMERCIAL)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Indicadores operativos: catálogo, stock bajo, usuarios, cotizaciones.',
  })
  @ApiResponse({ status: 200 })
  getSummary(): Promise<DashboardSummaryResponse> {
    return this.dashboard.getSummary();
  }

  @Get('sales-trend')
  @ApiOperation({ summary: 'Serie diaria de cotizaciones emitidas (para el gráfico de ventas).' })
  @ApiResponse({ status: 200 })
  getSalesTrend(@Query() query: SalesTrendQueryDto): Promise<SalesTrendPoint[]> {
    return this.dashboard.getSalesTrend(query.days);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Productos más vendidos por cantidad, sobre todas las cotizaciones.' })
  @ApiResponse({ status: 200 })
  getTopProducts(@Query() query: TopProductsQueryDto): Promise<TopProductStat[]> {
    return this.dashboard.getTopProducts(query.limit);
  }
}
