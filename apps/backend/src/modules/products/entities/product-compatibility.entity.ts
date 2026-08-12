import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Modelo } from '../../garage/entities/modelo.entity';

import { Product } from './product.entity';

/**
 * Junction table `compatibilidad` — PK compuesta (id_producto, id_modelo).
 * La entidad existe para registro en TypeORM; las mutaciones se hacen
 * via SQL en products.repository.ts para consistencia con el resto del módulo.
 */
@Entity({ name: 'compatibilidad' })
export class ProductCompatibility {
  @PrimaryColumn({ name: 'id_producto', type: 'int' })
  productId!: number;

  @PrimaryColumn({ name: 'id_modelo', type: 'int' })
  modeloId!: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_producto' })
  product!: Product;

  @ManyToOne(() => Modelo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_modelo' })
  modelo!: Modelo;
}
