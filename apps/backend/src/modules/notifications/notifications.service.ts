import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';

import { NotificationPreference } from './entities/notification-preference.entity';
import { Notification } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';

import type {
  CreatePushSubscriptionDto,
  NotificationChannel,
  NotificationPreferencesResponse,
  NotificationResponse,
  UpdateNotificationPreferencesDto,
} from '@kore/shared';

export interface EnqueueInput {
  userId: number;
  titulo: string;
  mensaje: string;
  canal: NotificationChannel;
  vehicleId?: number | null;
  planId?: number | null;
  tipo?: string;
  scheduledFor?: Date;
}

/**
 * Núcleo del sistema de notificaciones (US#2): encolar (outbox), listar el
 * centro in-app, contar no leídas, marcar leídas y gestionar preferencias.
 * El envío efectivo lo hace `NotificationDispatcher`.
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly prefsRepo: Repository<NotificationPreference>,
    @InjectRepository(PushSubscription)
    private readonly pushSubsRepo: Repository<PushSubscription>,
  ) {}

  /**
   * Inserta una notificación `pendiente`. Idempotente para recordatorios: si ya
   * existe una pendiente para el mismo (vehículo, tarea, canal) devuelve `null`
   * sin duplicar (respaldado por el índice único parcial de la migración).
   */
  async enqueue(input: EnqueueInput): Promise<Notification | null> {
    if (input.vehicleId != null && input.planId != null) {
      const existing = await this.repo.findOne({
        where: {
          vehicleId: input.vehicleId,
          planId: input.planId,
          canal: input.canal,
          estado: 'pendiente',
        },
      });
      if (existing) return null;
    }

    const entity = this.repo.create({
      userId: input.userId,
      vehicleId: input.vehicleId ?? null,
      planId: input.planId ?? null,
      tipo: input.tipo ?? 'recordatorio_mantenimiento',
      titulo: input.titulo,
      mensaje: input.mensaje,
      canal: input.canal,
      estado: 'pendiente',
      scheduledFor: input.scheduledFor ?? new Date(),
    });

    try {
      return await this.repo.save(entity);
    } catch (err: unknown) {
      // 23505 = colisión con el índice único parcial (carrera) → ya encolada.
      if ((err as { code?: string }).code === '23505') return null;
      throw err;
    }
  }

  /** Notificaciones del centro in-app del usuario (canal `app`), recientes primero. */
  async listForUser(userId: number): Promise<NotificationResponse[]> {
    const rows = await this.repo.find({
      where: { userId, canal: 'app' },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return rows.map((r) => NotificationsService.toResponse(r));
  }

  /** Nº de notificaciones in-app sin leer. */
  unreadCount(userId: number): Promise<number> {
    return this.repo
      .createQueryBuilder('n')
      .where('n.id_usuario = :userId', { userId })
      .andWhere("n.canal = 'app'")
      .andWhere('n.leida_en IS NULL')
      .getCount();
  }

  async markRead(userId: number, id: number): Promise<NotificationResponse> {
    const row = await this.repo.findOne({ where: { id, userId, canal: 'app' } });
    if (!row) throw new NotFoundException('Notificación no encontrada');
    if (!row.readAt) {
      row.readAt = new Date();
      row.estado = 'leida';
      await this.repo.save(row);
    }
    return NotificationsService.toResponse(row);
  }

  /** Preferencias del usuario, creando la fila por defecto en el primer acceso. */
  async getPreferences(userId: number): Promise<NotificationPreference> {
    let prefs = await this.prefsRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = await this.prefsRepo.save(this.prefsRepo.create({ userId }));
    }
    return prefs;
  }

  async getPreferencesResponse(userId: number): Promise<NotificationPreferencesResponse> {
    return NotificationsService.toPrefsResponse(await this.getPreferences(userId));
  }

  async updatePreferences(
    userId: number,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponse> {
    const prefs = await this.getPreferences(userId);
    if (dto.remindersEnabled !== undefined) prefs.remindersEnabled = dto.remindersEnabled;
    if (dto.emailChannel !== undefined) prefs.emailChannel = dto.emailChannel;
    if (dto.appChannel !== undefined) prefs.appChannel = dto.appChannel;
    if (dto.pushChannel !== undefined) prefs.pushChannel = dto.pushChannel;
    if (dto.daysBefore !== undefined) prefs.daysBefore = dto.daysBefore;
    const saved = await this.prefsRepo.save(prefs);
    return NotificationsService.toPrefsResponse(saved);
  }

  /** Registra (o actualiza) la suscripción Web Push de un navegador (ADR-0006). */
  async addPushSubscription(userId: number, dto: CreatePushSubscriptionDto): Promise<void> {
    const existing = await this.pushSubsRepo.findOne({ where: { endpoint: dto.endpoint } });
    if (existing) {
      existing.userId = userId;
      existing.p256dh = dto.keys.p256dh;
      existing.auth = dto.keys.auth;
      await this.pushSubsRepo.save(existing);
      return;
    }
    await this.pushSubsRepo.save(
      this.pushSubsRepo.create({
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
      }),
    );
  }

  /** Da de baja una suscripción Web Push (logout / botón "desactivar push"). */
  async removePushSubscription(userId: number, endpoint: string): Promise<void> {
    await this.pushSubsRepo.delete({ userId, endpoint });
  }

  /** Filas pendientes cuya hora programada ya pasó — la cola del despachador. */
  findDuePending(now: Date, limit = 200): Promise<Notification[]> {
    return this.repo.find({
      where: { estado: 'pendiente', scheduledFor: LessThanOrEqual(now) },
      order: { scheduledFor: 'ASC' },
      take: limit,
    });
  }

  save(notification: Notification): Promise<Notification> {
    return this.repo.save(notification);
  }

  static toResponse(row: Notification): NotificationResponse {
    return {
      id: row.id,
      tipo: row.tipo,
      titulo: row.titulo,
      mensaje: row.mensaje,
      canal: row.canal,
      estado: row.estado,
      vehicleId: row.vehicleId ?? undefined,
      planId: row.planId ?? undefined,
      createdAt: row.createdAt.toISOString(),
      readAt: row.readAt ? row.readAt.toISOString() : undefined,
    };
  }

  private static toPrefsResponse(p: NotificationPreference): NotificationPreferencesResponse {
    return {
      remindersEnabled: p.remindersEnabled,
      emailChannel: p.emailChannel,
      appChannel: p.appChannel,
      pushChannel: p.pushChannel,
      daysBefore: p.daysBefore,
    };
  }
}
