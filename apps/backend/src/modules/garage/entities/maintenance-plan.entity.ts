import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { MaintenanceGuide } from './maintenance-guide.entity';
import { ProductTask } from './product-task.entity';

@Entity({ name: 'tareas_mantenimiento' })
export class MaintenancePlan {
  @PrimaryGeneratedColumn({ name: 'id_tarea' })
  id!: number;

  @Column({ name: 'id_guia', type: 'int' })
  guideId!: number;

  @ManyToOne(() => MaintenanceGuide, (g) => g.plans)
  @JoinColumn({ name: 'id_guia' })
  guide!: MaintenanceGuide;

  @Column({ name: 'descripcion_tarea', length: 255 })
  description!: string;

  @Column({ name: 'intervalo_kilometraje', type: 'int' })
  mileageInterval!: number;

  @Column({ name: 'intervalo_meses', type: 'int', nullable: true })
  monthInterval?: number;

  @Column({ name: 'es_critica', default: false })
  isCritical!: boolean;

  @OneToMany(() => ProductTask, (pt) => pt.plan)
  productTasks?: ProductTask[];
}
