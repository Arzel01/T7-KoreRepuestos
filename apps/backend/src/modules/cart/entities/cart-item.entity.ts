import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { Product } from '../../products/entities/product.entity';

import { ShoppingCart } from './shopping-cart.entity';

/**
 * Línea del carrito (`items_carrito`).
 *
 * La tabla real solo guarda cantidad (no precio): el precio unitario se toma
 * del `precio_base` vigente del producto al calcular los totales. El índice
 * único (id_carrito, id_producto) hace cumplir la "prevención de duplicados":
 * añadir un producto ya presente incrementa la cantidad en vez de crear otra
 * fila. Ver [[project_real_db_schema]].
 */
@Entity({ name: 'items_carrito' })
@Unique('uq_items_carrito_producto', ['cartId', 'productId'])
export class CartItem {
  @PrimaryGeneratedColumn({ name: 'id_item' })
  id!: number;

  @Column({ name: 'id_carrito', type: 'int' })
  cartId!: number;

  @ManyToOne(() => ShoppingCart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_carrito' })
  cart!: ShoppingCart;

  @Column({ name: 'id_producto', type: 'int' })
  productId!: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_producto' })
  product!: Product;

  @Column({ name: 'cantidad', type: 'int' })
  quantity!: number;
}
