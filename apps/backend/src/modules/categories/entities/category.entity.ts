import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Entidad de dominio: Categoría jerárquica de productos.
 *
 * Mapea contra la tabla `product_categories` (ver `docker/postgres/init.sql`).
 *
 * Soporta árbol N-ario mediante auto-referencia (`parent` ↔ `children`).
 * Una categoría raíz tiene `parent_id = NULL`. La consulta del árbol completo
 * se hace por recursión con `WITH RECURSIVE` (ver CategoriesRepository.tree).
 */
@Entity({ name: 'product_categories' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // --- Auto-referencia: relación N:1 hacia la categoría padre ---------------
  @ManyToOne(() => Category, (cat) => cat.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category | null;

  @Index()
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId?: string | null;

  // --- Auto-referencia: relación 1:N hacia las categorías hijas -------------
  @OneToMany(() => Category, (cat) => cat.parent)
  children?: Category[];

  @Column({ length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ length: 140 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
