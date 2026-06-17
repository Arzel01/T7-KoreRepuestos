import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entidad de dominio: Categoría de productos.
 * Mapea contra la tabla `categorias` del schema real.
 * Soporta árbol N-ario mediante auto-referencia.
 */
@Entity({ name: 'categorias' })
export class Category {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  id!: number;

  @ManyToOne(() => Category, (cat) => cat.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_categoria_padre' })
  parent?: Category | null;

  @Column({ name: 'id_categoria_padre', type: 'int', nullable: true })
  parentId?: number | null;

  @OneToMany(() => Category, (cat) => cat.parent)
  children?: Category[];

  /** Nombre mapeado desde columna `nombre` en DB. */
  @Column({ name: 'nombre', length: 120 })
  name!: string;
}
