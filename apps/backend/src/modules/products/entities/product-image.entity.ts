import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Product } from './product.entity';

@Entity({ name: 'imagenes_producto' })
export class ProductImage {
  @PrimaryGeneratedColumn({ name: 'id_imagen' })
  id!: number;

  @Column({ name: 'id_producto', type: 'int' })
  productId!: number;

  @ManyToOne(() => Product, (p) => p.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_producto' })
  product?: Product;

  @Column({ name: 'url_imagen', length: 500 })
  url!: string;

  @Column({ name: 'es_principal', default: false })
  isPrimary!: boolean;
}
