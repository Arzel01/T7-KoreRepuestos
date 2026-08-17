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

  /**
   * `completedAt` es solo fecha (sin hora): con dos registros el mismo día,
   * el kilometraje desempata a favor del más avanzado (el service real más
   * reciente), evitando anclar el cálculo de "próximo" al registro viejo.
   */
  findLastForPlan(vehicleId: number, planId: number): Promise<MaintenanceLog | null> {
    return this.repo.findOne({
      where: { vehicleId, planId },
      order: { completedAt: 'DESC', completedMileage: 'DESC' },
    });
  }

  findByIdWithPlan(id: number): Promise<MaintenanceLog | null> {
    return this.repo.findOne({ where: { id }, relations: { plan: true } });
  }

  create(data: Partial<MaintenanceLog>): Promise<MaintenanceLog> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }
}
