import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Product } from './product.entity';

@Entity({ name: 'compatibilidades' })
export class Compatibility {
  @PrimaryGeneratedColumn({ name: 'id_compat' })
  id!: number;

  @Column({ name: 'id_producto', type: 'int' })
  productId!: number;

  @ManyToOne(() => Product, (p) => p.compatibilities)
  @JoinColumn({ name: 'id_producto' })
  product!: Product;

  @Column({ length: 100, nullable: true })
  marca?: string;

  @Column({ length: 150, nullable: true })
  modelo?: string;

  @Column({ name: 'año_inicio', type: 'smallint', nullable: true })
  anioInicio?: number;

  @Column({ name: 'año_fin', type: 'smallint', nullable: true })
  anioFin?: number;
}
