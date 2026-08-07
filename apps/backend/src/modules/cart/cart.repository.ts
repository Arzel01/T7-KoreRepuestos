import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CartItem } from './entities/cart-item.entity';
import { ShoppingCart } from './entities/shopping-cart.entity';

@Injectable()
export class CartRepository {
  constructor(
    @InjectRepository(ShoppingCart)
    private readonly carts: Repository<ShoppingCart>,
    @InjectRepository(CartItem)
    private readonly items: Repository<CartItem>,
  ) {}

  /**
   * Devuelve el carrito del usuario, creándolo si aún no existe
   * (gestión de "sesión" de carrito: un carrito persistente por usuario).
   */
  async ensureCart(userId: number): Promise<ShoppingCart> {
    const existing = await this.carts.findOne({ where: { userId } });
    if (existing) return existing;
    const created = this.carts.create({ userId });
    return this.carts.save(created);
  }

  /** Carga el carrito con sus líneas y el producto de cada línea. */
  loadWithItems(cartId: number): Promise<ShoppingCart | null> {
    return this.carts.findOne({
      where: { id: cartId },
      relations: { items: { product: { images: true } } },
      order: { items: { id: 'ASC' } },
    });
  }

  findItem(cartId: number, productId: number): Promise<CartItem | null> {
    return this.items.findOne({ where: { cartId, productId } });
  }

  /** Línea con su carrito, para validar propiedad antes de mutar/eliminar. */
  findItemWithCart(itemId: number): Promise<CartItem | null> {
    return this.items.findOne({ where: { id: itemId }, relations: { cart: true } });
  }

  saveItem(item: Partial<CartItem>): Promise<CartItem> {
    return this.items.save(this.items.create(item));
  }

  async updateItemQuantity(itemId: number, quantity: number): Promise<void> {
    await this.items.update(itemId, { quantity });
  }

  async removeItem(itemId: number): Promise<void> {
    await this.items.delete(itemId);
  }

  async clearItems(cartId: number): Promise<void> {
    await this.items.delete({ cartId });
  }

  /** Marca el carrito como modificado (refresca `actualizado_en`). */
  async touch(cartId: number): Promise<void> {
    await this.carts.update(cartId, { updatedAt: new Date() });
  }
}
