import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Preferencias de notificación de un usuario (US#2). Una fila por usuario. */
@Entity({ name: 'preferencias_notificacion' })
export class NotificationPreference {
  @PrimaryGeneratedColumn({ name: 'id_preferencia' })
  id!: number;

  @Column({ name: 'id_usuario', type: 'int', unique: true })
  userId!: number;

  @Column({ name: 'recordatorios_activos', default: true })
  remindersEnabled!: boolean;

  @Column({ name: 'canal_email', default: true })
  emailChannel!: boolean;

  @Column({ name: 'canal_app', default: true })
  appChannel!: boolean;

  @Column({ name: 'canal_push', default: false })
  pushChannel!: boolean;

  @Column({ name: 'dias_anticipacion', type: 'int', default: 7 })
  daysBefore!: number;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
  updatedAt!: Date;
}
