import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateMileageDto } from './dto/update-mileage.dto';
import { VehiclesService } from './vehicles.service';

import type { JwtPayload } from '../auth/dto/auth-response.dto';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('brands')
  @ApiOperation({ summary: 'Listar todas las marcas de vehículos.' })
  @ApiResponse({ status: 200 })
  getBrands() {
    return this.vehiclesService.listBrands();
  }

  @Get('brands/:brandId/models')
  @ApiOperation({ summary: 'Listar modelos de una marca.' })
  @ApiResponse({ status: 200 })
  getModels(@Param('brandId', new ParseIntPipe()) brandId: number) {
    return this.vehiclesService.listModelsByBrand(brandId);
  }

  @Get()
  @ApiOperation({ summary: 'Vehículos del usuario autenticado.' })
  @ApiResponse({ status: 200 })
  getVehicles(@CurrentUser() user: JwtPayload) {
    return this.vehiclesService.getByUser(Number(user.sub));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un vehículo.' })
  @ApiResponse({ status: 201 })
  createVehicle(@CurrentUser() user: JwtPayload, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(Number(user.sub), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un vehículo del usuario.' })
  @ApiResponse({ status: 204 })
  deleteVehicle(
    @Param('id', new ParseIntPipe()) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.vehiclesService.delete(id, Number(user.sub));
  }

  @Patch(':id/mileage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Actualizar kilometraje de un vehículo.' })
  @ApiResponse({ status: 204 })
  updateMileage(
    @Param('id', new ParseIntPipe()) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMileageDto,
  ): Promise<void> {
    return this.vehiclesService.updateMileage(id, Number(user.sub), dto);
  }

  @Post(':id/logs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un mantenimiento completado.' })
  @ApiResponse({ status: 201 })
  createLog(
    @Param('id', new ParseIntPipe()) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMaintenanceLogDto,
  ) {
    return this.vehiclesService.createLog(id, Number(user.sub), dto);
  }

  @Get(':id/calendar')
  @ApiOperation({ summary: 'Calendario de mantenimiento de un vehículo.' })
  @ApiResponse({ status: 200 })
  getCalendar(@Param('id', new ParseIntPipe()) id: number, @CurrentUser() user: JwtPayload) {
    return this.vehiclesService.getCalendar(id, Number(user.sub));
  }
}
