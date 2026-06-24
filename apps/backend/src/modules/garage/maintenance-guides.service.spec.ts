import { BadRequestException, NotFoundException } from '@nestjs/common';

import { MaintenanceGuidesService } from './maintenance-guides.service';

import type { CreateMaintenanceGuideDto } from './dto/create-maintenance-guide.dto';
import type { MaintenanceGuide } from './entities/maintenance-guide.entity';
import type { Modelo } from './entities/modelo.entity';
import type { MaintenanceGuideRepository } from './maintenance-guide.repository';
import type { Repository } from 'typeorm';

function buildModelo(overrides: Partial<Modelo> = {}): Modelo {
  return { id: 1, marcaId: 1, nombre: 'Corolla', guias: [], ...overrides } as Modelo;
}

function buildGuide(overrides: Partial<MaintenanceGuide> = {}): MaintenanceGuide {
  return {
    id: 10,
    modeloId: 1,
    descripcion: 'Guía test',
    plans: [] as any,
    modelo: buildModelo(),
    ...overrides,
  } as MaintenanceGuide;
}

describe('MaintenanceGuidesService', () => {
  let service: MaintenanceGuidesService;
  let mockGuidesRepo: jest.Mocked<
    Pick<MaintenanceGuideRepository, 'findByModel' | 'createWithPlans' | 'findById' | 'findAll'>
  >;
  let mockModelosRepo: jest.Mocked<Pick<Repository<Modelo>, 'findOne'>>;

  beforeEach(() => {
    mockGuidesRepo = {
      findByModel: jest.fn(),
      createWithPlans: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    mockModelosRepo = {
      findOne: jest.fn(),
    };

    service = new MaintenanceGuidesService(mockGuidesRepo as any, mockModelosRepo as any);
  });

  describe('create', () => {
    const dto: CreateMaintenanceGuideDto = {
      modelId: 1,
      description: 'Guía preventiva',
      plans: [{ description: 'Cambio de aceite', mileageInterval: 5000, isCritical: false }],
    };

    it('lanza NotFoundException si el modelo no existe', async () => {
      mockModelosRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow('Modelo con id 1 no encontrado');
      expect(mockGuidesRepo.findByModel).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si ya existe una guía para ese modelo', async () => {
      mockModelosRepo.findOne.mockResolvedValue(buildModelo());
      mockGuidesRepo.findByModel.mockResolvedValue([buildGuide()]);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('Ya existe una guía de mantenimiento');
      expect(mockGuidesRepo.createWithPlans).not.toHaveBeenCalled();
    });

    it('llama createWithPlans con los datos correctos cuando todo es válido', async () => {
      const created = buildGuide();
      mockModelosRepo.findOne.mockResolvedValue(buildModelo());
      mockGuidesRepo.findByModel.mockResolvedValue([]);
      mockGuidesRepo.createWithPlans.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(mockGuidesRepo.createWithPlans).toHaveBeenCalledWith(
        { modeloId: 1, descripcion: 'Guía preventiva' },
        [
          {
            description: 'Cambio de aceite',
            mileageInterval: 5000,
            monthInterval: undefined,
            isCritical: false,
            parts: undefined,
          },
        ],
      );
      expect(result).toBe(created);
    });

    it('crea la guía sin planes cuando dto.plans está undefined', async () => {
      const dtoSinPlanes: CreateMaintenanceGuideDto = { modelId: 1 };
      const created = buildGuide({ descripcion: undefined });
      mockModelosRepo.findOne.mockResolvedValue(buildModelo());
      mockGuidesRepo.findByModel.mockResolvedValue([]);
      mockGuidesRepo.createWithPlans.mockResolvedValue(created);

      await service.create(dtoSinPlanes);

      expect(mockGuidesRepo.createWithPlans).toHaveBeenCalledWith(
        { modeloId: 1, descripcion: undefined },
        undefined,
      );
    });
  });

  describe('findOne', () => {
    it('retorna la guía cuando existe', async () => {
      const guide = buildGuide();
      mockGuidesRepo.findById.mockResolvedValue(guide);

      const result = await service.findOne(10);

      expect(mockGuidesRepo.findById).toHaveBeenCalledWith(10);
      expect(result).toBe(guide);
    });

    it('lanza NotFoundException cuando la guía no existe', async () => {
      mockGuidesRepo.findById.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(99)).rejects.toThrow(
        'Guía de mantenimiento con id 99 no encontrada',
      );
    });
  });

  describe('findAll', () => {
    it('delega al repositorio y retorna la lista', async () => {
      const guides = [buildGuide(), buildGuide({ id: 11 })];
      mockGuidesRepo.findAll.mockResolvedValue(guides);

      const result = await service.findAll();

      expect(mockGuidesRepo.findAll).toHaveBeenCalledTimes(1);
      expect(result).toBe(guides);
    });
  });
});
