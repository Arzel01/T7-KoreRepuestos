import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { MaintenanceLog } from '../../maintenance/entities/maintenance-log.entity';

import { Modelo } from './modelo.entity';

@Entity({ name: 'vehiculos_usuario' })
export class VehicleUser {
  @PrimaryGeneratedColumn({ name: 'id_vehiculo_usuario' })
  id!: number;

  @Column({ name: 'id_usuario', type: 'int' })
  userId!: number;

  @Column({ name: 'id_modelo', type: 'int' })
  modelId!: number;

  @ManyToOne(() => Modelo)
  @JoinColumn({ name: 'id_modelo' })
  model!: Modelo;

  @Column({ length: 100, nullable: true })
  alias?: string;

  @Column({ name: 'anio', type: 'int' })
  year!: number;

  @Column({ length: 20, nullable: true, unique: true })
  placa?: string;

  @Column({ name: 'kilometraje_actual', type: 'int' })
  currentMileage!: number;

  @Column({ name: 'kilometraje_diario_promedio', type: 'int', default: 20 })
  averageDailyMileage!: number;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  createdAt!: Date;

  @OneToMany(() => MaintenanceLog, (l) => l.vehicle)
  logs?: MaintenanceLog[];
}
