import { Column, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { CartItem } from './cart-item.entity';

/**
 * Carrito de compras del usuario (`carrito_compras`).
 *
 * Un único carrito por usuario (UNIQUE en `id_usuario`); actúa como "sesión"
 * de compra persistente entre dispositivos. Ver [[project_real_db_schema]].
 */
@Entity({ name: 'carrito_compras' })
export class ShoppingCart {
  @PrimaryGeneratedColumn({ name: 'id_carrito' })
  id!: number;

  @Column({ name: 'id_usuario', type: 'int', unique: true })
  userId!: number;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => CartItem, (item) => item.cart)
  items?: CartItem[];
}
