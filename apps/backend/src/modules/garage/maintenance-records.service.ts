import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateMaintenanceRecordDto } from './dto/create-maintenance-record.dto';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { MaintenanceLogRepository } from './maintenance-log.repository';
import { VehiclesRepository } from './vehicles.repository';

import type { MaintenanceRecordResponse } from '@kore/shared';

/**
 * US#4 — Registros de mantenimiento.
 *
 * Un registro marca un servicio como completado y queda en el historial
 * (`historial_mantenimiento`). Reutiliza el repositorio de logs del garaje;
 * expone el API `/maintenance/records` centrado en historial + observaciones.
 */
@Injectable()
export class MaintenanceRecordsService {
  constructor(
    private readonly vehiclesRepo: VehiclesRepository,
    private readonly logsRepo: MaintenanceLogRepository,
  ) {}

  async create(
    userId: number,
    dto: CreateMaintenanceRecordDto,
  ): Promise<MaintenanceRecordResponse> {
    await this.requireOwnedVehicle(dto.vehicleId, userId);

    const completedAt = dto.completedAt ?? new Date().toISOString().split('T')[0];
    const record = await this.logsRepo.create({
      vehicleId: dto.vehicleId,
      planId: dto.planId,
      completedAt,
      completedMileage: dto.completedMileage,
      notes: dto.notes,
    });
    return this.toResponse(record);
  }

  async history(userId: number, vehicleId: number): Promise<MaintenanceRecordResponse[]> {
    await this.requireOwnedVehicle(vehicleId, userId);
    const logs = await this.logsRepo.findByVehicleWithPlan(vehicleId);
    return logs.map((log) => this.toResponse(log));
  }

  private async requireOwnedVehicle(vehicleId: number, userId: number): Promise<void> {
    const vehicle = await this.vehiclesRepo.findOne(vehicleId, userId);
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
  }

  private toResponse(log: MaintenanceLog): MaintenanceRecordResponse {
    return {
      id: log.id,
      vehicleId: log.vehicleId,
      planId: log.planId ?? undefined,
      planDescription: log.plan?.description,
      completedAt: log.completedAt,
      completedMileage: log.completedMileage,
      notes: log.notes,
    };
  }
}
