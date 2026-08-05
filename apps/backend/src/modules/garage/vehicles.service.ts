import { MileageSource, type CalendarItemDto } from '@kore/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateMileageDto } from './dto/update-mileage.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Marca } from './entities/marca.entity';
import { Modelo } from './entities/modelo.entity';
import { VehicleUser } from './entities/vehicle-user.entity';
import { summarizePlan } from './maintenance-calc';
import { MaintenanceLogRepository } from './maintenance-log.repository';
import { MaintenancePlannerService } from './maintenance-planner.service';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { VehiclesRepository } from './vehicles.repository';

import type { CalendarItemDto, VehiclePlanResponse } from '@kore/shared';
@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehiclesRepo: VehiclesRepository,
    private readonly logsRepo: MaintenanceLogRepository,
    private readonly planner: MaintenancePlannerService,
    private readonly reminderScheduler: ReminderSchedulerService,
    @InjectRepository(Marca)
    private readonly marcasRepo: Repository<Marca>,
    @InjectRepository(Modelo)
    private readonly modelosRepo: Repository<Modelo>,
  ) {}

  listBrands(): Promise<Marca[]> {
    return this.marcasRepo.find({ order: { nombre: 'ASC' } });
  }

  /**
   * `modelos` ya tiene UNIQUE (id_marca, nombre) tras la migración
   * DedupeModelos1781137369808, así que un `find` simple basta — sin el
   * DISTINCT ON que antes ocultaba las filas duplicadas.
   */
  listModelsByBrand(brandId: number): Promise<Modelo[]> {
    return this.modelosRepo.find({
      where: { marcaId: brandId },
      order: { nombre: 'ASC' },
    });
  }

  getByUser(userId: number): Promise<VehicleUser[]> {
    return this.vehiclesRepo.findByUser(userId);
  }

  async create(userId: number, dto: CreateVehicleDto): Promise<VehicleUser> {
    const modelo = await this.modelosRepo.findOne({
      where: { id: dto.modelId, marcaId: dto.brandId },
    });
    if (!modelo) {
      throw new BadRequestException('Modelo no encontrado para la marca indicada');
    }

    return this.vehiclesRepo.create({
      userId,
      modelId: dto.modelId,
      year: dto.year,
      placa: dto.plate,
      currentMileage: dto.currentMileage,
      averageDailyMileage: dto.averageDailyMileage ?? 20,
      alias: dto.alias,
    });
  }

  async update(vehicleId: number, userId: number, dto: UpdateVehicleDto): Promise<VehicleUser> {
    const vehicle = await this.vehiclesRepo.findOne(vehicleId, userId);
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

    if (dto.modelId !== undefined || dto.brandId !== undefined) {
      const brandId = dto.brandId ?? vehicle.model.marcaId;
      const modelId = dto.modelId ?? vehicle.modelId;
      const modelo = await this.modelosRepo.findOne({
        where: { id: modelId, marcaId: brandId },
      });
      if (!modelo) throw new BadRequestException('Modelo no encontrado para la marca indicada');
    }

    if (dto.currentMileage !== undefined && dto.currentMileage < vehicle.currentMileage) {
      throw new BadRequestException('El kilometraje no puede ser menor al actual');
    }

    const patch: Partial<VehicleUser> = {};
    if (dto.modelId !== undefined) patch.modelId = dto.modelId;
    if (dto.year !== undefined) patch.year = dto.year;
    if (dto.plate !== undefined) patch.placa = dto.plate;
    if (dto.currentMileage !== undefined) patch.currentMileage = dto.currentMileage;
    if (dto.averageDailyMileage !== undefined) patch.averageDailyMileage = dto.averageDailyMileage;
    if (Object.prototype.hasOwnProperty.call(dto, 'alias')) patch.alias = dto.alias;

    try {
      return await this.vehiclesRepo.update(vehicleId, patch);
    } catch (err: unknown) {
      const pg = err as { code?: string };
      if (pg.code === '23505') {
        throw new ConflictException('Ya existe un vehículo con esa placa');
      }
      throw err;
    }
  }

  async updateMileageFromUser(
    vehicleId: number,
    userId: number,
    dto: UpdateMileageDto,
  ): Promise<void> {
    const vehicle = await this.vehiclesRepo.findOne(vehicleId, userId);
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    if (dto.currentMileage < vehicle.currentMileage) {
      throw new BadRequestException('El kilometraje no puede ser menor al actual');
    }

    await this.vehiclesRepo.updateMileageByUser(vehicleId, dto.currentMileage);

    // US#2 — al subir el kilometraje pueden aparecer tareas vencidas: se encolan
    // recordatorios de inmediato. Nunca debe hacer fallar el PATCH.
    vehicle.currentMileage = dto.currentMileage;
    try {
      await this.reminderScheduler.checkVehicle(vehicle);
    } catch {
      // best-effort: el barrido diario volverá a intentarlo.
    }
  }

  async updateMileageFromService(vehicleId: number, dto: UpdateMileageDto): Promise<void> {
    const vehicle = await this.vehiclesRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

    const source = dto.source ?? MileageSource.USUARIO;

    if (source === MileageSource.IA) {
      if (dto.currentMileage < vehicle.currentMileage) {
        throw new BadRequestException(
          'El kilometraje estimado por IA no puede ser menor al kilometraje real del usuario',
        );
      }
      await this.vehiclesRepo.updateMileageByAi(vehicleId, dto.currentMileage);
      return;
    }

    if (dto.currentMileage < vehicle.currentMileage) {
      throw new BadRequestException('El kilometraje no puede ser menor al actual');
    }

    await this.vehiclesRepo.updateMileageByUser(vehicleId, dto.currentMileage);

    // Para fuente USUARIO vía servicio sí se agenda revisión de recordatorios.
    vehicle.currentMileage = dto.currentMileage;
    try {
      await this.reminderScheduler.checkVehicle(vehicle);
    } catch {
      // best-effort: el barrido diario volverá a intentarlo.
    }
  }

  async delete(vehicleId: number, userId: number): Promise<void> {
    const vehicle = await this.vehiclesRepo.findOne(vehicleId, userId);
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    await this.vehiclesRepo.delete(vehicleId);
  }

  async createLog(vehicleId: number, userId: number, dto: CreateMaintenanceLogDto) {
    const vehicle = await this.vehiclesRepo.findOne(vehicleId, userId);
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    if (vehicle.userId !== userId) throw new ForbiddenException();

    const today = new Date().toISOString().split('T')[0];
    return this.logsRepo.create({
      vehicleId,
      planId: dto.planId,
      completedAt: today,
      completedMileage: dto.completedMileage,
      notes: dto.notes,
    });
  }

  async getCalendar(vehicleId: number, userId: number): Promise<CalendarItemDto[]> {
    const vehicle = await this.vehiclesRepo.findOne(vehicleId, userId);
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    return this.planner.buildCalendar(vehicle);
  }

  /**
   * Plan de mantenimiento del vehículo (US#3): los mismos servicios del
   * calendario más la agregación de costos y contadores (críticos/vencidos).
   */
  async getPlan(vehicleId: number, userId: number): Promise<VehiclePlanResponse> {
    const vehicle = await this.vehiclesRepo.findOne(vehicleId, userId);
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

    const services = await this.planner.buildCalendar(vehicle);
    const summary = summarizePlan(services);

    return {
      vehicleId: vehicle.id,
      alias: vehicle.alias,
      year: vehicle.year,
      currentMileage: vehicle.currentMileage,
      averageDailyMileage: vehicle.averageDailyMileage,
      model: {
        id: vehicle.model.id,
        nombre: vehicle.model.nombre,
        marca: { id: vehicle.model.marca.id, nombre: vehicle.model.marca.nombre },
      },
      services,
      ...summary,
    };
  }
}
