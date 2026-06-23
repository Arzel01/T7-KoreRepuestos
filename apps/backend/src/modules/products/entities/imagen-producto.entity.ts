import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { Product } from './product.entity';

@Entity('imagenes_producto')
export class ImagenProducto {
  @PrimaryGeneratedColumn({ name: 'id_imagen' })
  idImagen!: number;

  @Column({ type: 'text', name: 'url_imagen' })
  urlImagen!: string;

  @Column({ type: 'boolean', name: 'es_principal', default: false })
  esPrincipal?: boolean = false;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_producto' })
  producto!: Product;
}
