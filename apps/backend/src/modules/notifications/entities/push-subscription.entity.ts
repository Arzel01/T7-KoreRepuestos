import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Suscripción Web Push de un navegador/dispositivo (ADR-0006). Una fila por
 * `PushSubscription` del navegador; un usuario puede tener varias (varios
 * dispositivos). `endpoint` identifica de forma única la suscripción ante el
 * servicio push del navegador (FCM/Mozilla/etc).
 */
@Entity({ name: 'suscripciones_push' })
export class PushSubscription {
  @PrimaryGeneratedColumn({ name: 'id_suscripcion' })
  id!: number;

  @Column({ name: 'id_usuario', type: 'int' })
  userId!: number;

  @Column({ name: 'endpoint', type: 'text', unique: true })
  endpoint!: string;

  @Column({ name: 'p256dh', length: 255 })
  p256dh!: string;

  @Column({ name: 'auth', length: 255 })
  auth!: string;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  createdAt!: Date;
}
