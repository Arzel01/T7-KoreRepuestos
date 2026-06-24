import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { MaintenanceGuide } from '../../maintenance/entities/maintenance-guide.entity';

import { Marca } from './marca.entity';

@Entity({ name: 'modelos' })
export class Modelo {
  @PrimaryGeneratedColumn({ name: 'id_modelo' })
  id!: number;

  @Column({ name: 'id_marca', type: 'int' })
  marcaId!: number;

  @ManyToOne(() => Marca, (m) => m.modelos)
  @JoinColumn({ name: 'id_marca' })
  marca!: Marca;

  @Column({ length: 150 })
  nombre!: string;

  @Column({ name: 'anio_inicio', type: 'int', nullable: true })
  anioInicio?: number;

  @Column({ name: 'anio_fin', type: 'int', nullable: true })
  anioFin?: number;

  @OneToMany(() => MaintenanceGuide, (g) => g.modelo)
  guias?: MaintenanceGuide[];
}
