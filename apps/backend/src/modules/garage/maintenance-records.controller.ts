import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';
import { MaintenanceRecordsService } from './maintenance-records.service';

import type { JwtPayload } from '../auth/dto/auth-response.dto';
import type { MaintenanceRecordResponse } from '@kore/shared';

@ApiTags('maintenance-records')
@ApiBearerAuth()
@Controller('maintenance/records')
export class MaintenanceRecordsController {
  constructor(private readonly service: MaintenanceRecordsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Marca un mantenimiento como completado (US#4).' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMaintenanceRecordDto,
  ): Promise<MaintenanceRecordResponse> {
    return this.service.create(Number(user.sub), dto);
  }

  @Get()
  @ApiOperation({ summary: 'Historial de mantenimiento de un vehículo (US#4).' })
  @ApiQuery({ name: 'vehicleId', type: Number })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado.' })
  history(
    @CurrentUser() user: JwtPayload,
    @Query('vehicleId', new ParseIntPipe()) vehicleId: number,
  ): Promise<MaintenanceRecordResponse[]> {
    return this.service.history(Number(user.sub), vehicleId);
  }
}
