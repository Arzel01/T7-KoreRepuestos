import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Product } from './product.entity';

@Entity({ name: 'fichas_tecnicas' })
export class TechnicalSheetEntry {
  @PrimaryGeneratedColumn({ name: 'id_ficha' })
  id!: number;

  @Column({ name: 'id_producto', type: 'int' })
  productId!: number;

  @ManyToOne(() => Product, (p) => p.technicalSheet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_producto' })
  product?: Product;

  @Column({ name: 'atributo', length: 200 })
  attribute!: string;

  @Column({ name: 'valor', length: 500 })
  value!: string;
}
