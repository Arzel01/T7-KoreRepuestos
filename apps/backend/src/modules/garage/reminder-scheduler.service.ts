import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { NotificationDispatcher } from '../notifications/notification-dispatcher.service';
import { NotificationsService } from '../notifications/notifications.service';

import { VehicleUser } from './entities/vehicle-user.entity';
import { MaintenancePlannerService } from './maintenance-planner.service';
import { VehiclesRepository } from './vehicles.repository';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * US#2 — Chequeo de recordatorios de mantenimiento. Un cron in-process
 * (`@nestjs/schedule`, sin Redis) barre los vehículos y encola recordatorios
 * para las tareas próximas/vencidas según las preferencias del usuario. El
 * mismo `checkVehicle` se dispara al actualizar el kilometraje de un vehículo.
 */
@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    private readonly vehiclesRepo: VehiclesRepository,
    private readonly planner: MaintenancePlannerService,
    private readonly notifications: NotificationsService,
    private readonly dispatcher: NotificationDispatcher,
    private readonly config: ConfigService,
  ) {}

  /** Barrido diario: revisa todos los vehículos y despacha lo encolado. */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async runReminderSweep(): Promise<void> {
    if (this.config.get<string>('NOTIFICATIONS_ENABLED') === 'false') return;

    const vehicles = await this.vehiclesRepo.findAllForReminders();
    let enqueued = 0;
    for (const vehicle of vehicles) {
      enqueued += await this.checkVehicle(vehicle);
    }
    const sent = await this.dispatcher.flush();
    this.logger.log(
      `Barrido de recordatorios: ${vehicles.length} vehículos, ${enqueued} encolados, ${sent} enviados`,
    );
  }

  /**
   * Encola recordatorios para las tareas próximas/vencidas de un vehículo,
   * respetando las preferencias del usuario. Devuelve cuántas notificaciones
   * nuevas encoló (idempotente: no duplica pendientes).
   */
  async checkVehicle(vehicle: VehicleUser): Promise<number> {
    const prefs = await this.notifications.getPreferences(vehicle.userId);
    if (!prefs.remindersEnabled || (!prefs.appChannel && !prefs.emailChannel)) return 0;

    const services = await this.planner.buildCalendar(vehicle);
    const now = new Date();
    const label =
      vehicle.alias?.trim() ||
      `${vehicle.model?.marca?.nombre ?? ''} ${vehicle.model?.nombre ?? ''}`.trim() ||
      'tu vehículo';

    let enqueued = 0;
    for (const s of services) {
      const daysUntil = Math.ceil(
        (new Date(s.nextServiceDate).getTime() - now.getTime()) / MS_PER_DAY,
      );
      const overdue = s.kmRemaining === 0;
      if (!overdue && daysUntil > prefs.daysBefore) continue;

      const titulo = overdue
        ? `Mantenimiento vencido: ${s.description}`
        : `Mantenimiento próximo: ${s.description}`;
      const mensaje = overdue
        ? `El servicio "${s.description}" de ${label} está vencido. Agéndalo cuanto antes.`
        : `El servicio "${s.description}" de ${label} vence en aprox. ${s.kmRemaining} km (${s.nextServiceDate}).`;

      const base = {
        userId: vehicle.userId,
        vehicleId: vehicle.id,
        planId: s.planId,
        titulo,
        mensaje,
      };

      if (prefs.appChannel && (await this.notifications.enqueue({ ...base, canal: 'app' }))) {
        enqueued += 1;
      }
      if (prefs.emailChannel && (await this.notifications.enqueue({ ...base, canal: 'email' }))) {
        enqueued += 1;
      }
    }
    return enqueued;
  }
}
