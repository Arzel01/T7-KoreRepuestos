import { ProductUnit } from '@kore/shared';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Category } from '../../categories/entities/category.entity';

/**
 * Entidad de dominio: Producto del catálogo de repuestos.
 *
 * Mapea contra la tabla `products` (ver `docker/postgres/init.sql`).
 *
 * Reglas de negocio asociadas a esta entidad (verificadas por los DTOs y
 * por las CHECK constraints en SQL):
 *   · `price`   > 0                — todo repuesto debe tener precio positivo
 *   · `stock`   > 0 al crearse     — no se publica un repuesto sin existencias
 *   · `sku`     único              — clave de inventario
 *   · `categoryId` referencia válida (FK en SQL, ON DELETE SET NULL)
 */
@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ length: 64 })
  sku!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // --- Relación N:1 con Categoría -------------------------------------------
  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category | null;

  @Index()
  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId?: string | null;

  @Column({ length: 120, nullable: true })
  brand?: string;

  /**
   * `numeric(12,2)` en Postgres → TypeORM devuelve `string` por defecto.
   * Forzamos el tipo `number` con un transformer para evitar bugs aritméticos.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string | null) => (v === null ? null : Number(v)),
    },
  })
  price!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: {
      to: (v: number | null | undefined) => v ?? null,
      from: (v: string | null) => (v === null ? null : Number(v)),
    },
  })
  cost?: number;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @Column({ name: 'min_stock', type: 'int', default: 0 })
  minStock!: number;

  @Column({ type: 'varchar', length: 30, default: ProductUnit.UNIDAD })
  unit!: ProductUnit;

  @Column({ name: 'image_url', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;

  // ----------------------------------------------------------------------
  // Reglas de negocio expresadas como métodos puros (testables en unitarios)
  // ----------------------------------------------------------------------

  /** Indica si el stock está por debajo del mínimo configurado. */
  isLowStock(): boolean {
    return this.stock <= this.minStock;
  }

  /** Margen de utilidad (price - cost). Devuelve `null` si no hay cost. */
  margin(): number | null {
    if (this.cost === undefined || this.cost === null) return null;
    return Number((this.price - this.cost).toFixed(2));
  }

  /** Margen porcentual sobre el precio (round 2 decimales). */
  marginPercent(): number | null {
    const m = this.margin();
    if (m === null || this.price === 0) return null;
    return Number(((m / this.price) * 100).toFixed(2));
  }
}
