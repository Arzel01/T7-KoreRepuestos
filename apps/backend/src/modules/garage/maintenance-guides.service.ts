import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateMaintenanceGuideDto } from './dto/create-maintenance-guide.dto';
import { MaintenanceGuide } from './entities/maintenance-guide.entity';
import { Modelo } from './entities/modelo.entity';
import { MaintenanceGuideRepository } from './maintenance-guide.repository';

@Injectable()
export class MaintenanceGuidesService {
  constructor(
    private readonly guidesRepo: MaintenanceGuideRepository,
    @InjectRepository(Modelo)
    private readonly modelosRepo: Repository<Modelo>,
  ) {}

  async create(dto: CreateMaintenanceGuideDto): Promise<MaintenanceGuide> {
    // Validar que el modelo exista antes de crear la guía
    const modelo = await this.modelosRepo.findOne({ where: { id: dto.modelId } });
    if (!modelo) {
      throw new NotFoundException(`Modelo con id ${dto.modelId} no encontrado`);
    }

    // Validar que no exista ya una guía para este modelo (1 guía por modelo)
    const existing = await this.guidesRepo.findByModel(dto.modelId);
    if (existing.length > 0) {
      throw new BadRequestException(
        `Ya existe una guía de mantenimiento para el modelo "${modelo.nombre}". ` +
          `Usa la guía existente (id: ${existing[0].id}) para agregar tareas.`,
      );
    }

    return this.guidesRepo.createWithPlans(
      { modeloId: dto.modelId, descripcion: dto.description },
      dto.plans?.map((p) => ({
        description: p.description,
        mileageInterval: p.mileageInterval,
        monthInterval: p.monthInterval,
        isCritical: p.isCritical ?? false,
      })),
    );
  }
}
