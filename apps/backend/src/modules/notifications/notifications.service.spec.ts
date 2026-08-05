import { NotificationsService } from './notifications.service';

import type { NotificationPreference } from './entities/notification-preference.entity';
import type { Notification } from './entities/notification.entity';
import type { ObjectLiteral, Repository } from 'typeorm';

type RepoMock<T extends ObjectLiteral> = jest.Mocked<
  Pick<Repository<T>, 'findOne' | 'create' | 'save' | 'find'>
>;

function buildRepo<T extends ObjectLiteral>(): RepoMock<T> {
  return {
    findOne: jest.fn(),
    create: jest.fn((x) => x as T),
    save: jest.fn(async (x) => ({ id: 1, ...(x as object) }) as unknown as T),
    find: jest.fn(),
  } as unknown as RepoMock<T>;
}

describe('NotificationsService', () => {
  let notifRepo: RepoMock<Notification>;
  let prefsRepo: RepoMock<NotificationPreference>;
  let service: NotificationsService;

  beforeEach(() => {
    notifRepo = buildRepo<Notification>();
    prefsRepo = buildRepo<NotificationPreference>();
    service = new NotificationsService(
      notifRepo as unknown as Repository<Notification>,
      prefsRepo as unknown as Repository<NotificationPreference>,
    );
  });

  describe('enqueue', () => {
    const reminder = {
      userId: 1,
      vehicleId: 2,
      planId: 3,
      canal: 'app' as const,
      titulo: 'T',
      mensaje: 'M',
    };

    it('no duplica si ya existe una notificación pendiente para (vehículo, tarea, canal)', async () => {
      notifRepo.findOne.mockResolvedValue({ id: 9 } as Notification);
      const result = await service.enqueue(reminder);
      expect(result).toBeNull();
      expect(notifRepo.save).not.toHaveBeenCalled();
    });

    it('inserta una notificación pendiente cuando no hay una previa', async () => {
      notifRepo.findOne.mockResolvedValue(null);
      const result = await service.enqueue(reminder);
      expect(result).not.toBeNull();
      expect(notifRepo.save).toHaveBeenCalledTimes(1);
      expect(notifRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'pendiente', canal: 'app', userId: 1 }),
      );
    });

    it('omite el chequeo de idempotencia si no hay vehículo/tarea', async () => {
      const result = await service.enqueue({
        userId: 1,
        canal: 'email',
        titulo: 'T',
        mensaje: 'M',
      });
      expect(notifRepo.findOne).not.toHaveBeenCalled();
      expect(notifRepo.save).toHaveBeenCalledTimes(1);
      expect(result).not.toBeNull();
    });

    it('trata la colisión 23505 (índice único parcial) como ya-encolada', async () => {
      notifRepo.findOne.mockResolvedValue(null);
      notifRepo.save.mockRejectedValueOnce({ code: '23505' });
      const result = await service.enqueue(reminder);
      expect(result).toBeNull();
    });
  });

  describe('preferencias', () => {
    it('crea preferencias por defecto en el primer acceso', async () => {
      prefsRepo.findOne.mockResolvedValue(null);
      prefsRepo.save.mockResolvedValue({
        id: 1,
        userId: 1,
        remindersEnabled: true,
        emailChannel: true,
        appChannel: true,
        daysBefore: 7,
      } as NotificationPreference);

      const prefs = await service.getPreferences(1);
      expect(prefsRepo.create).toHaveBeenCalledWith({ userId: 1 });
      expect(prefs.remindersEnabled).toBe(true);
    });

    it('actualiza solo los campos provistos', async () => {
      const existing = {
        id: 1,
        userId: 1,
        remindersEnabled: true,
        emailChannel: true,
        appChannel: true,
        daysBefore: 7,
      } as NotificationPreference;
      prefsRepo.findOne.mockResolvedValue(existing);
      prefsRepo.save.mockImplementation(async (x) => x as NotificationPreference);

      const res = await service.updatePreferences(1, { emailChannel: false, daysBefore: 14 });

      expect(res.emailChannel).toBe(false);
      expect(res.daysBefore).toBe(14);
      expect(res.appChannel).toBe(true); // sin cambios
      expect(res.remindersEnabled).toBe(true);
    });
  });
});
