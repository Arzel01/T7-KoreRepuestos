import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { VehicleUser } from './vehicle-user.entity';

@Entity({ name: 'historial_mantenimiento' })
export class MaintenanceLog {
  @PrimaryGeneratedColumn({ name: 'id_historial' })
  id!: number;

  @Column({ name: 'id_vehiculo_usuario', type: 'int' })
  vehicleId!: number;

  @ManyToOne(() => VehicleUser, (v) => v.logs)
  @JoinColumn({ name: 'id_vehiculo_usuario' })
  vehicle!: VehicleUser;

  @Column({ name: 'id_tarea', type: 'int', nullable: true })
  planId?: number;

  @Column({ name: 'fecha_servicio', type: 'date' })
  completedAt!: string;

  @Column({ name: 'kilometraje_servicio', type: 'int' })
  completedMileage!: number;

  @Column({ name: 'comentarios', type: 'text', nullable: true })
  notes?: string;
}
