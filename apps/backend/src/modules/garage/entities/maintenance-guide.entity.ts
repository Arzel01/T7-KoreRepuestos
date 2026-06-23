import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { MaintenancePlan } from './maintenance-plan.entity';
import { Modelo } from './modelo.entity';

@Entity({ name: 'guias_mantenimiento' })
export class MaintenanceGuide {
  @PrimaryGeneratedColumn({ name: 'id_guia' })
  id!: number;

  @Column({ name: 'id_modelo', type: 'int' })
  modeloId!: number;

  @ManyToOne(() => Modelo, (m) => m.guias)
  @JoinColumn({ name: 'id_modelo' })
  modelo!: Modelo;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @OneToMany(() => MaintenancePlan, (p) => p.guide)
  plans?: MaintenancePlan[];
}
