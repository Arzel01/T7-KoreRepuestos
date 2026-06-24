import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

import { CreateMaintenanceGuideDto } from './dto/create-maintenance-guide.dto';
import { CreateMaintenanceTaskDto } from './dto/create-maintenance-task.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('maintenance')
@ApiBearerAuth()
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('tasks')
  @ApiOperation({ summary: 'Listar tareas de mantenimiento por marca y modelo.' })
  @ApiQuery({ name: 'brandId', required: false, type: Number })
  @ApiQuery({ name: 'modelId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de tareas de mantenimiento.' })
  listTasks(@Query('brandId') brandId?: string, @Query('modelId') modelId?: string) {
    const parsedBrandId = brandId ? Number(brandId) : undefined;
    const parsedModelId = modelId ? Number(modelId) : undefined;

    return this.maintenanceService.listMaintenanceTasks(
      Number.isNaN(parsedBrandId) ? undefined : parsedBrandId,
      Number.isNaN(parsedModelId) ? undefined : parsedModelId,
    );
  }

  @Get('guides')
  @ApiOperation({ summary: 'Listar guías de mantenimiento con sus tareas (por marca/modelo).' })
  @ApiQuery({ name: 'brandId', required: false, type: Number })
  @ApiQuery({ name: 'modelId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de guías con tareas anidadas.' })
  listGuides(@Query('brandId') brandId?: string, @Query('modelId') modelId?: string) {
    const parsedBrandId = brandId ? Number(brandId) : undefined;
    const parsedModelId = modelId ? Number(modelId) : undefined;

    return this.maintenanceService.listMaintenanceGuides(
      Number.isNaN(parsedBrandId) ? undefined : parsedBrandId,
      Number.isNaN(parsedModelId) ? undefined : parsedModelId,
    );
  }

  @Post('guides')
  @ApiOperation({ summary: 'Crear una nueva guía de mantenimiento.' })
  @ApiResponse({ status: 201, description: 'Guía creada correctamente.' })
  createGuide(@Body() dto: CreateMaintenanceGuideDto) {
    return this.maintenanceService.createMaintenanceGuide(dto);
  }

  @Post('guides/:guideId/tasks')
  @ApiOperation({ summary: 'Crear una nueva tarea dentro de una guía de mantenimiento.' })
  @ApiResponse({ status: 201, description: 'Tarea creada dentro de la guía.' })
  createTask(
    @Param('guideId', ParseIntPipe) guideId: number,
    @Body() dto: CreateMaintenanceTaskDto,
  ) {
    return this.maintenanceService.createMaintenanceTask(guideId, dto);
  }
}
