import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MaintenanceGuide } from './entities/maintenance-guide.entity';
import { MaintenancePlan } from './entities/maintenance-plan.entity';
import { ProductTask } from './entities/product-task.entity';

@Injectable()
export class MaintenanceGuideRepository {
  constructor(
    @InjectRepository(MaintenanceGuide)
    private readonly guides: Repository<MaintenanceGuide>,
  ) {}

  /**
   * Crea una guía y opcionalmente sus tareas en la misma transacción,
   * evitando guías huérfanas si falla la inserción de alguna tarea.
   */
  async createWithPlans(
    guideData: Pick<MaintenanceGuide, 'modeloId' | 'descripcion'>,
    plansData?: Array<
      Pick<MaintenancePlan, 'description' | 'mileageInterval' | 'monthInterval' | 'isCritical'> & {
        parts?: Array<{ productId: number; quantity?: number }>;
      }
    >,
  ): Promise<MaintenanceGuide> {
    return this.guides.manager.transaction(async (em) => {
      const guide = em.create(MaintenanceGuide, guideData);
      const savedGuide = await em.save(guide);

      if (plansData?.length) {
        for (const { parts, ...planData } of plansData) {
          const savedPlan = await em.save(
            em.create(MaintenancePlan, { ...planData, guideId: savedGuide.id }),
          );

          if (parts?.length) {
            const partEntities = parts.map((p) =>
              em.create(ProductTask, {
                taskId: savedPlan.id,
                productId: p.productId,
                cantidad: p.quantity ?? 1,
              }),
            );
            await em.save(partEntities);
          }
        }
      }

      // Devolver la guía completa con sus planes e partes hidratados
      return em.findOneOrFail(MaintenanceGuide, {
        where: { id: savedGuide.id },
        relations: { plans: { productTasks: { product: true } }, modelo: { marca: true } },
      });
    });
  }

  findById(id: number): Promise<MaintenanceGuide | null> {
    return this.guides.findOne({
      where: { id },
      relations: { plans: true, modelo: { marca: true } },
    });
  }

  findByModel(modeloId: number): Promise<MaintenanceGuide[]> {
    return this.guides.find({
      where: { modeloId },
      relations: { plans: true },
      order: { id: 'ASC' },
    });
  }

  findAll(): Promise<MaintenanceGuide[]> {
    return this.guides.find({
      relations: { modelo: { marca: true } },
      order: { id: 'ASC' },
    });
  }
}
