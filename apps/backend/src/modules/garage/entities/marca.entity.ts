import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Modelo } from './modelo.entity';

@Entity({ name: 'marcas' })
export class Marca {
  @PrimaryGeneratedColumn({ name: 'id_marca' })
  id!: number;

  @Column({ length: 100 })
  nombre!: string;

  @OneToMany(() => Modelo, (m) => m.marca)
  modelos?: Modelo[];
}
