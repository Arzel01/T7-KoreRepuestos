import { BadRequestException, NotFoundException } from '@nestjs/common';

import { CreateMaintenanceGuideDto } from './dto/create-maintenance-guide.dto';
import { MaintenanceGuide } from './entities/maintenance-guide.entity';
import { Modelo } from './entities/modelo.entity';
import { MaintenanceGuideRepository } from './maintenance-guide.repository';
import { MaintenanceGuidesService } from './maintenance-guides.service';

const makeModelo = (id: number, nombre = 'Corolla'): Modelo => {
  const m = new Modelo();
  m.id = id;
  m.nombre = nombre;
  return m;
};

const makeGuide = (id: number, modeloId: number): MaintenanceGuide => {
  const g = new MaintenanceGuide();
  g.id = id;
  g.modeloId = modeloId;
  return g;
};

describe('MaintenanceGuidesService (unit)', () => {
  let service: MaintenanceGuidesService;
  let guidesRepo: jest.Mocked<MaintenanceGuideRepository>;
  let modelosRepo: { findOne: jest.Mock };

  beforeEach(() => {
    guidesRepo = {
      findByModel: jest.fn(),
      createWithPlans: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<MaintenanceGuideRepository>;

    modelosRepo = { findOne: jest.fn() };

    service = new MaintenanceGuidesService(guidesRepo, modelosRepo as any);
  });

  describe('create()', () => {
    const dto: CreateMaintenanceGuideDto = {
      modelId: 1,
      description: 'Guía básica',
      plans: [],
    };

    it('lanza NotFoundException si el modelo no existe', async () => {
      modelosRepo.findOne.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(modelosRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('lanza BadRequestException si ya existe una guía para el modelo', async () => {
      modelosRepo.findOne.mockResolvedValue(makeModelo(1));
      guidesRepo.findByModel.mockResolvedValue([makeGuide(99, 1)]);
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });

    it('crea la guía cuando el modelo existe y no tiene guía previa', async () => {
      const expected = makeGuide(1, 1);
      modelosRepo.findOne.mockResolvedValue(makeModelo(1));
      guidesRepo.findByModel.mockResolvedValue([]);
      guidesRepo.createWithPlans.mockResolvedValue(expected);

      const result = await service.create(dto);
      expect(result).toBe(expected);
      expect(guidesRepo.createWithPlans).toHaveBeenCalledWith(
        { modeloId: 1, descripcion: 'Guía básica' },
        [],
      );
    });

    it('mapea correctamente los planes y partes del DTO', async () => {
      const dtoConPlanes: CreateMaintenanceGuideDto = {
        modelId: 2,
        description: 'Guía completa',
        plans: [
          {
            description: 'Cambio de aceite',
            mileageInterval: 5000,
            monthInterval: 6,
            isCritical: true,
            parts: [{ productId: 10, quantity: 2 }],
          },
        ],
      };
      modelosRepo.findOne.mockResolvedValue(makeModelo(2));
      guidesRepo.findByModel.mockResolvedValue([]);
      guidesRepo.createWithPlans.mockResolvedValue(makeGuide(1, 2));

      await service.create(dtoConPlanes);

      expect(guidesRepo.createWithPlans).toHaveBeenCalledWith(
        { modeloId: 2, descripcion: 'Guía completa' },
        [
          {
            description: 'Cambio de aceite',
            mileageInterval: 5000,
            monthInterval: 6,
            isCritical: true,
            parts: [{ productId: 10, quantity: 2 }],
          },
        ],
      );
    });

    it('isCritical toma false por defecto si no se especifica', async () => {
      const dtoSinCritica: CreateMaintenanceGuideDto = {
        modelId: 3,
        plans: [{ description: 'Revisión general', mileageInterval: 10000 }],
      };
      modelosRepo.findOne.mockResolvedValue(makeModelo(3));
      guidesRepo.findByModel.mockResolvedValue([]);
      guidesRepo.createWithPlans.mockResolvedValue(makeGuide(1, 3));

      await service.create(dtoSinCritica);

      const callArgs = guidesRepo.createWithPlans.mock.calls[0][1];
      expect(callArgs?.[0].isCritical).toBe(false);
    });
  });

  describe('findOne()', () => {
    it('retorna la guía si existe', async () => {
      const guide = makeGuide(5, 1);
      guidesRepo.findById.mockResolvedValue(guide);
      const result = await service.findOne(5);
      expect(result).toBe(guide);
    });

    it('lanza NotFoundException si la guía no existe', async () => {
      guidesRepo.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll()', () => {
    it('delega directamente al repositorio', async () => {
      const guides = [makeGuide(1, 1), makeGuide(2, 2)];
      guidesRepo.findAll.mockResolvedValue(guides);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });
  });
});
