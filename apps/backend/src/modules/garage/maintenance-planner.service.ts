import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MaintenancePlan } from './entities/maintenance-plan.entity';
import { VehicleUser } from './entities/vehicle-user.entity';
import { computeNextService, estimateCost } from './maintenance-calc';
import { MaintenanceLogRepository } from './maintenance-log.repository';

import type { CalendarItemDto } from '@kore/shared';

/**
 * Construye los ítems de calendario/plan de un vehículo aplicando el algoritmo
 * puro de `maintenance-calc.ts`. Servicio compartido por `VehiclesService`
 * (endpoints de calendario/plan) y `ReminderSchedulerService` (recordatorios),
 * de modo que la lógica vive en un único lugar y no hay ciclos entre ambos.
 */
@Injectable()
export class MaintenancePlannerService {
  constructor(
    @InjectRepository(MaintenancePlan)
    private readonly plansRepo: Repository<MaintenancePlan>,
    private readonly logsRepo: MaintenanceLogRepository,
  ) {}

  async buildCalendar(vehicle: VehicleUser): Promise<CalendarItemDto[]> {
    const plans = await this.plansRepo
      .createQueryBuilder('t')
      .innerJoinAndSelect('t.guide', 'g')
      .where('g.id_modelo = :modelId', { modelId: vehicle.modelId })
      .leftJoinAndSelect('t.productTasks', 'pt')
      .leftJoinAndSelect('pt.product', 'prod')
      .getMany();

    const now = new Date();

    const items = await Promise.all(
      plans.map(async (plan): Promise<CalendarItemDto> => {
        const lastLog = await this.logsRepo.findLastForPlan(vehicle.id, plan.id);

        const { kmRemaining, nextServiceDate } = computeNextService(
          {
            mileageInterval: plan.mileageInterval,
            monthInterval: plan.monthInterval,
            currentMileage: vehicle.currentMileage,
            averageDailyMileage: vehicle.averageDailyMileage,
            lastCompletedAt: lastLog?.completedAt,
          },
          now,
        );

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
          nextServiceDate,
          estimatedCost: estimateCost(products),
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
