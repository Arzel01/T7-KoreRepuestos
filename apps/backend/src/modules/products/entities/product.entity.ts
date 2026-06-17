import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Category } from '../../categories/entities/category.entity';

/**
 * Entidad de dominio: Producto del catálogo de repuestos.
 * Mapea contra la tabla `productos` del schema real.
 *
 * Las propiedades JS mantienen nombres en inglés (name, price, stock)
 * mientras las columnas DB usan los nombres reales (nombre, precio_base, stock_actual).
 */
@Entity({ name: 'productos' })
export class Product {
  @PrimaryGeneratedColumn({ name: 'id_producto' })
  id!: number;

  @Index({ unique: true })
  @Column({ length: 64 })
  sku!: string;

  @Column({ name: 'nombre', length: 200 })
  name!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_categoria' })
  category?: Category | null;

  @Index()
  @Column({ name: 'id_categoria', type: 'int', nullable: true })
  categoryId?: number | null;

  @Column({
    name: 'precio_base',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string | null) => (v === null ? null : Number(v)),
    },
  })
  price!: number;

  @Column({ name: 'stock_actual', type: 'int', default: 0 })
  stock!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  createdAt!: Date;
}
