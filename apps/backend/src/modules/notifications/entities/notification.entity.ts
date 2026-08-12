import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

import type { NotificationChannel, NotificationStatus } from '@kore/shared';

/**
 * Notificación del usuario. Es a la vez el **modelo de recordatorio** y una
 * fila del **outbox** (ver ADR-0002): nace en `pendiente` y el despachador la
 * lleva a `enviada`/`fallida`. Propiedades en inglés, columnas en español.
 */
@Entity({ name: 'notificaciones' })
export class Notification {
  @PrimaryGeneratedColumn({ name: 'id_notificacion' })
  id!: number;

  @Column({ name: 'id_usuario', type: 'int' })
  userId!: number;

  @Column({ name: 'id_vehiculo_usuario', type: 'int', nullable: true })
  vehicleId?: number | null;

  @Column({ name: 'id_tarea', type: 'int', nullable: true })
  planId?: number | null;

  @Column({ name: 'tipo', length: 50, default: 'recordatorio_mantenimiento' })
  tipo!: string;

  @Column({ name: 'titulo', length: 160 })
  titulo!: string;

  @Column({ name: 'mensaje', type: 'text' })
  mensaje!: string;

  @Column({ name: 'canal', length: 10, default: 'app' })
  canal!: NotificationChannel;

  @Column({ name: 'estado', length: 12, default: 'pendiente' })
  estado!: NotificationStatus;

  @Column({ name: 'programada_para', type: 'timestamp' })
  scheduledFor!: Date;

  @Column({ name: 'enviada_en', type: 'timestamp', nullable: true })
  sentAt?: Date | null;

  @Column({ name: 'leida_en', type: 'timestamp', nullable: true })
  readAt?: Date | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  createdAt!: Date;
}
