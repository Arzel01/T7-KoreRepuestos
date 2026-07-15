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

  findPartsByMileage(mileage: number): Promise<
    Array<{
      id: number;
      sku: string;
      name: string;
      price: number;
      stock: number;
      quantity: number;
      taskDescription: string;
      mileageInterval: number;
      isCritical: boolean;
    }>
  > {
    return this.guides.manager.query(
      `SELECT DISTINCT ON (p.id_producto)
              p.id_producto AS id,
              p.sku,
              p.nombre AS name,
              p.precio_base::float AS price,
              p.stock_actual AS stock,
              pt.cantidad AS quantity,
              t.descripcion_tarea AS "taskDescription",
              t.intervalo_kilometraje AS "mileageInterval",
              t.es_critica AS "isCritical"
       FROM tareas_mantenimiento t
       INNER JOIN productos_tarea pt ON pt.id_tarea = t.id_tarea
       INNER JOIN productos p ON p.id_producto = pt.id_producto
       WHERE t.intervalo_kilometraje <= $1
         AND p.is_active = TRUE
         AND p.stock_actual > 0
       ORDER BY p.id_producto, t.intervalo_kilometraje DESC`,
      [mileage],
    );
  }
}
