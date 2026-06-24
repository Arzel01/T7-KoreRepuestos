import { UserRole } from '@kore/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import { CreateMaintenanceGuideDto } from './dto/create-maintenance-guide.dto';
import { MaintenanceGuidesService } from './maintenance-guides.service';

import type { MaintenanceGuide } from './entities/maintenance-guide.entity';

/**
 * Endpoints para gestión de guías de mantenimiento.
 *
 * Una guía de mantenimiento (`guias_mantenimiento`) define el plan preventivo
 * oficial para un modelo de vehículo: qué tareas hacer, cada cuántos km/meses,
 * y si son críticas. Solo el Administrador puede crearlas; el front-end y el
 * módulo de calendario las leen para mostrar el calendario de cada vehículo.
 */
@ApiTags('maintenance')
@ApiBearerAuth()
@Controller('maintenance')
export class MaintenanceGuidesController {
  constructor(private readonly guidesService: MaintenanceGuidesService) {}

  @Get('guides')
  @Public()
  @ApiOperation({ summary: 'Listar todas las guías de mantenimiento.' })
  @ApiResponse({ status: 200, description: 'Lista de guías con su modelo y marca.' })
  findAll(): Promise<MaintenanceGuide[]> {
    return this.guidesService.findAll();
  }

  @Get('guides/:id')
  @Public()
  @ApiOperation({ summary: 'Obtener una guía de mantenimiento por ID.' })
  @ApiResponse({ status: 200, description: 'Guía con sus tareas y modelo.' })
  @ApiResponse({ status: 404, description: 'Guía no encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<MaintenanceGuide> {
    return this.guidesService.findOne(id);
  }

  @Post('guides')
  @Roles(UserRole.ADMINISTRADOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una guía de mantenimiento.',
    description:
      'Crea la guía oficial de mantenimiento preventivo para un modelo de vehículo. ' +
      'Opcionalmente incluye sus tareas (planes) en la misma petición. ' +
      'Solo puede existir una guía por modelo — si ya existe, devuelve 400. ' +
      'Requiere rol Administrador.',
  })
  @ApiResponse({ status: 201, description: 'Guía creada con sus planes.' })
  @ApiResponse({
    status: 400,
    description: 'Ya existe una guía para ese modelo, o datos inválidos.',
  })
  @ApiResponse({ status: 404, description: 'Modelo de vehículo no encontrado.' })
  create(@Body() dto: CreateMaintenanceGuideDto): Promise<MaintenanceGuide> {
    return this.guidesService.create(dto);
  }
}
