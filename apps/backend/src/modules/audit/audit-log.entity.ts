import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'logs_auditoria' })
export class AuditLog {
  @PrimaryGeneratedColumn({ name: 'id_log' })
  id!: number;

  @Column({ name: 'id_usuario', type: 'int', nullable: true })
  userId?: number | null;

  @Column({ name: 'tabla_afectada', length: 100 })
  tableName!: string;

  @Column({ name: 'accion', length: 20 })
  action!: 'INSERT' | 'UPDATE' | 'DELETE';

  @Column({ name: 'descripcion_cambio', type: 'text', nullable: true })
  description?: string | null;

  @CreateDateColumn({ name: 'fecha_cambio', type: 'timestamp' })
  changedAt!: Date;
}
