import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Canal por el que se entrega una notificación. */
export type NotificationChannel = 'app' | 'email';

/**
 * Estado de una notificación dentro del outbox Postgres (ver ADR-0002):
 * `pendiente` → aún no despachada · `enviada` → entregada al canal ·
 * `leida` → vista por el usuario (solo canal app) · `fallida` → error al enviar.
 */
export type NotificationStatus = 'pendiente' | 'enviada' | 'leida' | 'fallida';

export interface NotificationResponse {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  canal: NotificationChannel;
  estado: NotificationStatus;
  vehicleId?: number;
  planId?: number;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPreferencesResponse {
  remindersEnabled: boolean;
  emailChannel: boolean;
  appChannel: boolean;
  /** Días de anticipación con los que se avisa antes de un servicio. */
  daysBefore: number;
}

/** Actualización parcial de las preferencias de notificación del usuario. */
export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  remindersEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailChannel?: boolean;

  @IsOptional()
  @IsBoolean()
  appChannel?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  daysBefore?: number;
}
