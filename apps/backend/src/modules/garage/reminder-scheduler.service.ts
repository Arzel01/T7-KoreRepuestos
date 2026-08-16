import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { NotificationDispatcher } from '../notifications/notification-dispatcher.service';
import { NotificationsService } from '../notifications/notifications.service';

import { VehicleUser } from './entities/vehicle-user.entity';
import { classifyReminder } from './maintenance-calc';
import { MaintenancePlannerService } from './maintenance-planner.service';
import { VehiclesRepository } from './vehicles.repository';

import type { ReminderUrgency } from './maintenance-calc';
import type { CalendarItemDto } from '@kore/shared';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Título/mensaje/tipo por tramo de urgencia (US#2 · recordatorios escalonados). */
function buildReminderContent(
  urgency: ReminderUrgency,
  s: CalendarItemDto,
  label: string,
): { tipo: string; titulo: string; mensaje: string } {
  const tipo = `recordatorio_mantenimiento_${urgency}`;
  if (urgency === 'vencido') {
    return {
      tipo,
      titulo: `Mantenimiento vencido: ${s.description}`,
      mensaje: `El servicio "${s.description}" de ${label} está vencido. Agéndalo cuanto antes.`,
    };
  }
  if (urgency === 'urgente') {
    return {
      tipo,
      titulo: `Mantenimiento muy próximo: ${s.description}`,
      mensaje: `El servicio "${s.description}" de ${label} vence en menos de 100 km (quedan ${s.kmRemaining} km).`,
    };
  }
  return {
    tipo,
    titulo: `Mantenimiento próximo: ${s.description}`,
    mensaje: `El servicio "${s.description}" de ${label} vence en aprox. ${s.kmRemaining} km (${s.nextServiceDate}).`,
  };
}

/**
 * US#2 — Chequeo de recordatorios de mantenimiento. Un cron in-process
 * (`@nestjs/schedule`, sin Redis) barre los vehículos y encola recordatorios
 * para las tareas próximas/vencidas según las preferencias del usuario. El
 * mismo `checkVehicle` se dispara al actualizar el kilometraje de un vehículo
 * y al iniciar sesión (`checkUser`), así el usuario ve el aviso sin esperar
 * al barrido de las 7am.
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

  /**
   * Barrido diario: avanza el odómetro estimado de cada vehículo y luego
   * revisa/despacha recordatorios. El avance de kilometraje corre siempre
   * (no depende de `NOTIFICATIONS_ENABLED`, que solo gobierna el envío de
   * recordatorios).
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async runReminderSweep(): Promise<void> {
    const vehicles = await this.vehiclesRepo.findAllForReminders();
    await this.projectDailyMileage(vehicles);

    if (this.config.get<string>('NOTIFICATIONS_ENABLED') === 'false') return;

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
   * Avanza el kilometraje estimado (`+= promedio diario`) de todos los
   * vehículos en una sola sentencia SQL, y refleja el nuevo valor en los
   * objetos ya cargados en memoria para que el resto del barrido (cálculo de
   * recordatorios) use el kilometraje actualizado sin una segunda consulta.
   * Es una estimación: la próxima actualización manual del usuario sigue
   * siendo la fuente de verdad y el avance continúa sumando desde ahí.
   */
  private async projectDailyMileage(vehicles: VehicleUser[]): Promise<void> {
    if (vehicles.length === 0) return;
    const updated = await this.vehiclesRepo.incrementAllMileage();
    for (const vehicle of vehicles) {
      vehicle.currentMileage += vehicle.averageDailyMileage;
    }
    this.logger.log(`Avance diario de kilometraje: ${updated} vehículos actualizados`);
  }

  /** Chequea todos los vehículos de un usuario (US#2, disparado al hacer login). */
  async checkUser(userId: number): Promise<number> {
    const vehicles = await this.vehiclesRepo.findByUser(userId);
    let enqueued = 0;
    for (const vehicle of vehicles) {
      enqueued += await this.checkVehicle(vehicle);
    }
    return enqueued;
  }

  /**
   * Encola recordatorios para las tareas próximas/vencidas de un vehículo,
   * respetando las preferencias del usuario. Devuelve cuántas notificaciones
   * nuevas encoló (idempotente: no duplica pendientes).
   */
  async checkVehicle(vehicle: VehicleUser): Promise<number> {
    const prefs = await this.notifications.getPreferences(vehicle.userId);
    if (!prefs.remindersEnabled || (!prefs.appChannel && !prefs.emailChannel && !prefs.pushChannel))
      return 0;

    const services = await this.planner.buildCalendar(vehicle);
    const now = new Date();
    const label =
      vehicle.alias?.trim() ||
      `${vehicle.model?.marca?.nombre ?? ''} ${vehicle.model?.nombre ?? ''}`.trim() ||
      'tu vehículo';

    let enqueued = 0;
    for (const s of services) {
      const daysRemaining = Math.max(
        0,
        Math.ceil((new Date(s.nextServiceDate).getTime() - now.getTime()) / MS_PER_DAY),
      );
      const urgency = classifyReminder(
        { kmRemaining: s.kmRemaining, nextServiceDate: s.nextServiceDate, daysRemaining },
        prefs.daysBefore,
      );
      if (!urgency) continue;

      const { tipo, titulo, mensaje } = buildReminderContent(urgency, s, label);

      const base = {
        userId: vehicle.userId,
        vehicleId: vehicle.id,
        planId: s.planId,
        tipo,
        titulo,
        mensaje,
      };

      if (prefs.appChannel && (await this.notifications.enqueue({ ...base, canal: 'app' }))) {
        enqueued += 1;
      }
      if (prefs.emailChannel && (await this.notifications.enqueue({ ...base, canal: 'email' }))) {
        enqueued += 1;
      }
      if (prefs.pushChannel && (await this.notifications.enqueue({ ...base, canal: 'push' }))) {
        enqueued += 1;
      }
    }
    return enqueued;
  }
}
