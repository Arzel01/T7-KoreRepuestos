import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { MaintenanceGuide } from './maintenance-guide.entity';
import { TaskProduct } from './task-product.entity';

@Entity('tareas_mantenimiento')
export class MaintenanceTask {
  @PrimaryGeneratedColumn({ name: 'id_tarea' })
  id!: number;

  @Column({ name: 'id_guia' })
  guideId!: number;

  @Column({ name: 'descripcion_tarea', type: 'varchar' })
  taskDescription!: string;

  @Column({ name: 'intervalo_kilometraje', type: 'int' })
  mileageInterval!: number;

  @ManyToOne(() => MaintenanceGuide, (guide) => guide.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_guia' })
  guide!: MaintenanceGuide;

  @OneToMany(() => TaskProduct, (tp) => tp.task, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  taskProducts!: TaskProduct[];
}
