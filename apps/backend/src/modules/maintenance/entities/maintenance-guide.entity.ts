import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { MaintenanceTask } from './maintenance-task.entity';

@Entity('guias_mantenimiento')
export class MaintenanceGuide {
  @PrimaryGeneratedColumn({ name: 'id_guia' })
  id!: number;

  @Column({ name: 'id_modelo' })
  modelId!: number;

  @Column({ name: 'descripcion', type: 'text' })
  description!: string;

  @OneToMany(() => MaintenanceTask, (task) => task.guide, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  tasks!: MaintenanceTask[];
}
