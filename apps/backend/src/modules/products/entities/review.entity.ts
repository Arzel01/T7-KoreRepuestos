import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

import { Product } from './product.entity';

@Entity({ name: 'reseñas' })
export class Review {
  @PrimaryGeneratedColumn({ name: 'id_reseña' })
  id!: number;

  @Index()
  @Column({ name: 'id_producto', type: 'int' })
  productId!: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_producto' })
  product!: Product;

  @Index()
  @Column({ name: 'id_usuario', type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  user!: User;

  @Column({ name: 'calificacion', type: 'int' })
  rating!: number;

  @Column({ name: 'titulo', length: 200, nullable: true })
  title?: string;

  @Column({ name: 'comentario', type: 'text', nullable: true })
  comment?: string;

  @Column({ name: 'votos_util', type: 'int', default: 0 })
  helpfulVotes!: number;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  createdAt!: Date;
}
