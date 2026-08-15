import { NotFoundException } from '@nestjs/common';

import { MaintenanceRecordsService } from './maintenance-records.service';

import type { MaintenanceLog } from './entities/maintenance-log.entity';
import type { MaintenanceLogRepository } from './maintenance-log.repository';
import type { VehiclesRepository } from './vehicles.repository';

/**
 * Tests unitarios de MaintenanceRecordsService (US#4).
 * Repositorios mockeados → sin Postgres, corren en la suite unit.
 */
describe('MaintenanceRecordsService', () => {
  let service: MaintenanceRecordsService;
  let vehiclesRepo: { findOne: jest.Mock };
  let logsRepo: {
    create: jest.Mock;
    findByVehicleWithPlan: jest.Mock;
    findByIdWithPlan: jest.Mock;
  };

  const USER_ID = 7;
  const VEHICLE_ID = 3;

  beforeEach(() => {
    vehiclesRepo = { findOne: jest.fn() };
    logsRepo = { create: jest.fn(), findByVehicleWithPlan: jest.fn(), findByIdWithPlan: jest.fn() };
    service = new MaintenanceRecordsService(
      vehiclesRepo as unknown as VehiclesRepository,
      logsRepo as unknown as MaintenanceLogRepository,
    );
  });

  describe('create', () => {
    it('crea el registro con la fecha indicada y devuelve la respuesta mapeada, con planDescription recargado', async () => {
      vehiclesRepo.findOne.mockResolvedValue({ id: VEHICLE_ID, userId: USER_ID });
      logsRepo.create.mockImplementation((data: Partial<MaintenanceLog>) =>
        Promise.resolve({ id: 50, ...data } as MaintenanceLog),
      );
      // save() no trae la relación `plan` — el servicio la recarga con findByIdWithPlan.
      logsRepo.findByIdWithPlan.mockResolvedValue({
        id: 50,
        vehicleId: VEHICLE_ID,
        planId: 12,
        completedAt: '2026-07-01',
        completedMileage: 45000,
        notes: 'Cambio de aceite y filtro',
        plan: { description: 'Cambio de aceite' },
      } as unknown as MaintenanceLog);

      const res = await service.create(USER_ID, {
        vehicleId: VEHICLE_ID,
        planId: 12,
        completedMileage: 45000,
        completedAt: '2026-07-01',
        notes: 'Cambio de aceite y filtro',
      });

      expect(logsRepo.create).toHaveBeenCalledWith({
        vehicleId: VEHICLE_ID,
        planId: 12,
        completedAt: '2026-07-01',
        completedMileage: 45000,
        notes: 'Cambio de aceite y filtro',
      });
      expect(logsRepo.findByIdWithPlan).toHaveBeenCalledWith(50);
      expect(res).toMatchObject({
        id: 50,
        vehicleId: VEHICLE_ID,
        planId: 12,
        planDescription: 'Cambio de aceite',
        completedMileage: 45000,
        notes: 'Cambio de aceite y filtro',
      });
    });

    it('usa la fecha de hoy cuando no se envía completedAt', async () => {
      vehiclesRepo.findOne.mockResolvedValue({ id: VEHICLE_ID, userId: USER_ID });
      logsRepo.create.mockImplementation((data: Partial<MaintenanceLog>) =>
        Promise.resolve({ id: 51, ...data } as MaintenanceLog),
      );
      logsRepo.findByIdWithPlan.mockResolvedValue(null);

      const today = new Date().toISOString().split('T')[0];
      const res = await service.create(USER_ID, {
        vehicleId: VEHICLE_ID,
        completedMileage: 1000,
      });

      expect(res.completedAt).toBe(today);
    });

    it('404 si el vehículo no pertenece al usuario', async () => {
      vehiclesRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create(USER_ID, { vehicleId: 999, completedMileage: 0 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(logsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('history', () => {
    it('devuelve el historial mapeado incluyendo la descripción del plan', async () => {
      vehiclesRepo.findOne.mockResolvedValue({ id: VEHICLE_ID, userId: USER_ID });
      logsRepo.findByVehicleWithPlan.mockResolvedValue([
        {
          id: 1,
          vehicleId: VEHICLE_ID,
          planId: 12,
          completedAt: '2026-07-01',
          completedMileage: 45000,
          notes: 'ok',
          plan: { description: 'Cambio de aceite' },
        },
        {
          id: 2,
          vehicleId: VEHICLE_ID,
          planId: undefined,
          completedAt: '2026-05-01',
          completedMileage: 40000,
          notes: undefined,
          plan: null,
        },
      ] as unknown as MaintenanceLog[]);

      const res = await service.history(USER_ID, VEHICLE_ID);

      expect(res).toHaveLength(2);
      expect(res[0].planDescription).toBe('Cambio de aceite');
      expect(res[1].planDescription).toBeUndefined();
    });

    it('404 si el vehículo no pertenece al usuario', async () => {
      vehiclesRepo.findOne.mockResolvedValue(null);
      await expect(service.history(USER_ID, 999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
