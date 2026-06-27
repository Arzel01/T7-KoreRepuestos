import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateMileageDto } from './dto/update-mileage.dto';
import { MaintenancePlan } from './entities/maintenance-plan.entity';
import { Marca } from './entities/marca.entity';
import { Modelo } from './entities/modelo.entity';
import { VehicleUser } from './entities/vehicle-user.entity';
import { MaintenanceLogRepository } from './maintenance-log.repository';
import { VehiclesRepository } from './vehicles.repository';

import type { CalendarItemDto } from '@kore/shared';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehiclesRepo: VehiclesRepository,
    private readonly logsRepo: MaintenanceLogRepository,
    @InjectRepository(Marca)
    private readonly marcasRepo: Repository<Marca>,
    @InjectRepository(Modelo)
    private readonly modelosRepo: Repository<Modelo>,
    @InjectRepository(MaintenancePlan)
    private readonly plansRepo: Repository<MaintenancePlan>,
  ) {}

  listBrands(): Promise<Marca[]> {
    return this.marcasRepo.find({ order: { nombre: 'ASC' } });
  }

  /**
   * Band-aid temporal: `modelos` tiene filas duplicadas (mismo id_marca+nombre)
   * porque a la tabla le falta un UNIQUE que el seed pueda usar como conflict
   * target. `DISTINCT ON` deja una sola fila por nombre (la de id más bajo)
   * sin tocar los datos. Arreglo de raíz (constraint + limpieza) pendiente.
   */
  listModelsByBrand(brandId: number): Promise<Modelo[]> {
    return this.modelosRepo
      .createQueryBuilder('m')
      .distinctOn(['m.nombre'])
      .where('m.id_marca = :brandId', { brandId })
      .orderBy('m.nombre', 'ASC')
      .addOrderBy('m.id_modelo', 'ASC')
      .getMany();
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

  async updateMileage(vehicleId: number, userId: number, dto: UpdateMileageDto): Promise<void> {
    const vehicle = await this.vehiclesRepo.findOne(vehicleId, userId);
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    if (dto.currentMileage < vehicle.currentMileage) {
      throw new BadRequestException('El kilometraje no puede ser menor al actual');
    }
    await this.vehiclesRepo.updateMileage(vehicleId, dto.currentMileage);
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

    const plans = await this.plansRepo
      .createQueryBuilder('t')
      .innerJoinAndSelect('t.guide', 'g')
      .where('g.id_modelo = :modelId', { modelId: vehicle.modelId })
      .leftJoinAndSelect('t.productTasks', 'pt')
      .leftJoinAndSelect('pt.product', 'prod')
      .getMany();

    const today = new Date();

    const items = await Promise.all(
      plans.map(async (plan): Promise<CalendarItemDto> => {
        const lastLog = await this.logsRepo.findLastForPlan(vehicleId, plan.id);

        const cycleKm =
          Math.floor(vehicle.currentMileage / plan.mileageInterval) * plan.mileageInterval;
        const nextKmTarget =
          cycleKm < vehicle.currentMileage ? cycleKm + plan.mileageInterval : cycleKm;
        const kmRemaining = Math.max(0, nextKmTarget - vehicle.currentMileage);

        const daysUntilKm =
          vehicle.averageDailyMileage > 0 ? kmRemaining / vehicle.averageDailyMileage : Infinity;

        let nextServiceDate = new Date(today);
        nextServiceDate.setDate(today.getDate() + Math.ceil(daysUntilKm));

        if (plan.monthInterval) {
          const baseDate = lastLog?.completedAt ? new Date(lastLog.completedAt) : today;
          const dateByMonths = new Date(baseDate);
          dateByMonths.setMonth(dateByMonths.getMonth() + plan.monthInterval);
          if (dateByMonths < nextServiceDate) {
            nextServiceDate = dateByMonths;
          }
        }

        const products = (plan.productTasks ?? []).map((pt) => ({
          id: pt.product.id,
          name: pt.product.name,
          price: pt.product.price,
          quantity: pt.cantidad,
        }));

        return {
          planId: plan.id,
          description: plan.description,
          mileageInterval: plan.mileageInterval,
          monthInterval: plan.monthInterval ?? undefined,
          isCritical: plan.isCritical,
          kmRemaining,
          nextServiceDate: nextServiceDate.toISOString().split('T')[0],
          lastLog: lastLog
            ? {
                id: lastLog.id,
                planId: lastLog.planId,
                completedAt: lastLog.completedAt,
                completedMileage: lastLog.completedMileage,
                notes: lastLog.notes,
              }
            : undefined,
          products,
        };
      }),
    );

    return items.sort((a, b) => a.nextServiceDate.localeCompare(b.nextServiceDate));
  }
}
