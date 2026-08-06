import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MaintenanceLog } from './entities/maintenance-log.entity';

@Injectable()
export class MaintenanceLogRepository {
  constructor(
    @InjectRepository(MaintenanceLog)
    private readonly repo: Repository<MaintenanceLog>,
  ) {}

  findByVehicle(vehicleId: number): Promise<MaintenanceLog[]> {
    return this.repo.find({
      where: { vehicleId },
      order: { completedAt: 'DESC' },
    });
  }

  /** Historial de un vehículo con la tarea del plan asociada (US#4). */
  findByVehicleWithPlan(vehicleId: number): Promise<MaintenanceLog[]> {
    return this.repo.find({
      where: { vehicleId },
      relations: { plan: true },
      order: { completedAt: 'DESC', id: 'DESC' },
    });
  }

  findLastForPlan(vehicleId: number, planId: number): Promise<MaintenanceLog | null> {
    return this.repo.findOne({
      where: { vehicleId, planId },
      order: { completedAt: 'DESC' },
    });
  }

  create(data: Partial<MaintenanceLog>): Promise<MaintenanceLog> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }
}
