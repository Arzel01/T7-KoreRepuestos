import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Modelo } from '../garage/entities/modelo.entity';

import { CreateMaintenanceGuideDto } from './dto/create-maintenance-guide.dto';
import { CreateMaintenanceTaskDto } from './dto/create-maintenance-task.dto';
import { MaintenanceGuide } from './entities/maintenance-guide.entity';
import { MaintenancePlan } from './entities/maintenance-plan.entity';

import type { MaintenanceGuideResponse, MaintenanceTaskResponse } from '@kore/shared';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenancePlan)
    private readonly plansRepo: Repository<MaintenancePlan>,
    @InjectRepository(Modelo)
    private readonly modelosRepo: Repository<Modelo>,
  ) {}

  async listMaintenanceTasks(
    brandId?: number,
    modelId?: number,
  ): Promise<MaintenanceTaskResponse[]> {
    const query = this.plansRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.guide', 'g')
      .innerJoinAndSelect('g.modelo', 'm')
      .innerJoinAndSelect('m.marca', 'b')
      .leftJoinAndSelect('p.productTasks', 'pt');

    if (brandId !== undefined) {
      query.andWhere('b.id_marca = :brandId', { brandId });
    }
    if (modelId !== undefined) {
      query.andWhere('m.id_modelo = :modelId', { modelId });
    }

    const plans = await query
      .orderBy('b.nombre', 'ASC')
      .addOrderBy('m.nombre', 'ASC')
      .addOrderBy('p.intervalo_kilometraje', 'ASC')
      .getMany();

    return plans.map((plan) => ({
      id: plan.id,
      brandId: plan.guide.modelo.marca.id,
      modelId: plan.guide.modelo.id,
      brandName: plan.guide.modelo.marca.nombre,
      modelName: plan.guide.modelo.nombre,
      mileageInterval: plan.mileageInterval,
      monthInterval: plan.monthInterval ?? undefined,
      description: plan.description,
      isCritical: plan.isCritical,
      parts: plan.productTasks?.reduce((sum, pt) => sum + pt.cantidad, 0) ?? 0,
    }));
  }

  async listMaintenanceGuides(
    brandId?: number,
    modelId?: number,
  ): Promise<MaintenanceGuideResponse[]> {
    const query = this.plansRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.guide', 'g')
      .innerJoinAndSelect('g.modelo', 'm')
      .innerJoinAndSelect('m.marca', 'b')
      .leftJoinAndSelect('p.productTasks', 'pt');

    if (brandId !== undefined) {
      query.andWhere('b.id_marca = :brandId', { brandId });
    }
    if (modelId !== undefined) {
      query.andWhere('m.id_modelo = :modelId', { modelId });
    }

    const plans = await query
      .orderBy('b.nombre', 'ASC')
      .addOrderBy('m.nombre', 'ASC')
      .addOrderBy('p.intervalo_kilometraje', 'ASC')
      .getMany();

    const map = new Map<number, MaintenanceGuideResponse>();
    for (const plan of plans) {
      const guide = plan.guide;
      const guideId = guide.id;
      const task: MaintenanceTaskResponse = {
        id: plan.id,
        brandId: guide.modelo.marca.id,
        modelId: guide.modelo.id,
        brandName: guide.modelo.marca.nombre,
        modelName: guide.modelo.nombre,
        mileageInterval: plan.mileageInterval,
        monthInterval: plan.monthInterval ?? undefined,
        description: plan.description,
        isCritical: plan.isCritical,
        parts: plan.productTasks?.reduce((sum, pt) => sum + pt.cantidad, 0) ?? 0,
      };

      if (!map.has(guideId)) {
        map.set(guideId, {
          id: guideId,
          modelId: guide.modelo.id,
          modelName: guide.modelo.nombre,
          brandId: guide.modelo.marca.id,
          brandName: guide.modelo.marca.nombre,
          description: guide.descripcion ?? undefined,
          tasks: [task],
        });
      } else {
        map.get(guideId)!.tasks.push(task);
      }
    }

    return Array.from(map.values());
  }

  async createMaintenanceGuide(dto: CreateMaintenanceGuideDto): Promise<MaintenanceGuideResponse> {
    const modelo = await this.modelosRepo.findOne({
      where: { id: dto.modelId },
      relations: ['marca'],
    });

    if (!modelo) {
      throw new BadRequestException('Modelo no encontrado para la guía');
    }

    const guide = this.plansRepo.manager.create(MaintenanceGuide, {
      modeloId: dto.modelId,
      descripcion: dto.description,
    });

    const savedGuide = await this.plansRepo.manager.save(guide);

    return {
      id: savedGuide.id,
      modelId: modelo.id,
      modelName: modelo.nombre,
      brandId: modelo.marca.id,
      brandName: modelo.marca.nombre,
      description: savedGuide.descripcion ?? undefined,
      tasks: [],
    };
  }

  async createMaintenanceTask(
    guideId: number,
    dto: CreateMaintenanceTaskDto,
  ): Promise<MaintenanceTaskResponse> {
    const guide = await this.plansRepo.manager.findOne(MaintenanceGuide, {
      where: { id: guideId },
      relations: ['modelo', 'modelo.marca'],
    });

    if (!guide) {
      throw new BadRequestException('Guía no encontrada');
    }

    const plan = this.plansRepo.create({
      guideId,
      description: dto.description,
      mileageInterval: dto.mileageInterval,
      monthInterval: dto.monthInterval,
      isCritical: dto.isCritical ?? false,
    });

    const savedPlan = await this.plansRepo.save(plan);

    return {
      id: savedPlan.id,
      brandId: guide.modelo.marca.id,
      modelId: guide.modelo.id,
      brandName: guide.modelo.marca.nombre,
      modelName: guide.modelo.nombre,
      mileageInterval: savedPlan.mileageInterval,
      monthInterval: savedPlan.monthInterval ?? undefined,
      description: savedPlan.description,
      isCritical: savedPlan.isCritical,
      parts: 0,
    };
  }
}
