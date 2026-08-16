import { ReminderSchedulerService } from './reminder-scheduler.service';

import type { VehicleUser } from './entities/vehicle-user.entity';
import type { MaintenancePlannerService } from './maintenance-planner.service';
import type { VehiclesRepository } from './vehicles.repository';
import type { NotificationDispatcher } from '../notifications/notification-dispatcher.service';
import type { NotificationsService } from '../notifications/notifications.service';
import type { ConfigService } from '@nestjs/config';

function buildVehicle(overrides: Partial<VehicleUser> = {}): VehicleUser {
  return {
    id: 1,
    userId: 1,
    modelId: 1,
    year: 2020,
    currentMileage: 1000,
    averageDailyMileage: 20,
    createdAt: new Date(),
    ...overrides,
  } as VehicleUser;
}

describe('ReminderSchedulerService.runReminderSweep — avance diario de kilometraje', () => {
  let vehiclesRepo: jest.Mocked<
    Pick<VehiclesRepository, 'findAllForReminders' | 'incrementAllMileage'>
  >;
  let notifications: jest.Mocked<Pick<NotificationsService, 'getPreferences'>>;
  let dispatcher: jest.Mocked<Pick<NotificationDispatcher, 'flush'>>;
  let config: jest.Mocked<Pick<ConfigService, 'get'>>;
  let service: ReminderSchedulerService;

  beforeEach(() => {
    vehiclesRepo = {
      findAllForReminders: jest.fn(),
      incrementAllMileage: jest.fn().mockResolvedValue(1),
    };
    notifications = {
      // Preferencias con recordatorios desactivados → checkVehicle no hace más
      // consultas, así el test queda enfocado en el avance de kilometraje.
      getPreferences: jest.fn().mockResolvedValue({ remindersEnabled: false }),
    };
    dispatcher = { flush: jest.fn().mockResolvedValue(0) };
    config = { get: jest.fn().mockReturnValue(undefined) };

    service = new ReminderSchedulerService(
      vehiclesRepo as unknown as VehiclesRepository,
      {} as MaintenancePlannerService,
      notifications as unknown as NotificationsService,
      dispatcher as unknown as NotificationDispatcher,
      config as unknown as ConfigService,
    );
  });

  it('suma el promedio diario al kilometraje de cada vehículo vía una sola sentencia SQL', async () => {
    vehiclesRepo.findAllForReminders.mockResolvedValue([
      buildVehicle({ id: 1, currentMileage: 1000, averageDailyMileage: 20 }),
      buildVehicle({ id: 2, currentMileage: 5000, averageDailyMileage: 55 }),
    ]);

    await service.runReminderSweep();

    expect(vehiclesRepo.incrementAllMileage).toHaveBeenCalledTimes(1);
  });

  it('no llama al UPDATE si no hay vehículos', async () => {
    vehiclesRepo.findAllForReminders.mockResolvedValue([]);

    await service.runReminderSweep();

    expect(vehiclesRepo.incrementAllMileage).not.toHaveBeenCalled();
  });

  it('avanza el kilometraje aunque NOTIFICATIONS_ENABLED esté en false', async () => {
    config.get.mockReturnValue('false');
    vehiclesRepo.findAllForReminders.mockResolvedValue([buildVehicle()]);

    await service.runReminderSweep();

    expect(vehiclesRepo.incrementAllMileage).toHaveBeenCalledTimes(1);
    expect(notifications.getPreferences).not.toHaveBeenCalled();
  });
});
