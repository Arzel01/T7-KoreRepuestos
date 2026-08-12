import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CartItem } from './entities/cart-item.entity';
import { ShoppingCart } from './entities/shopping-cart.entity';

/** Cantidad final ya resuelta (tope de stock aplicado) para un producto del alta masiva. */
export interface BulkUpsertEntry {
  productId: number;
  quantity: number;
}

@Injectable()
export class CartRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
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

  /**
   * US#5 — alta masiva, en una sola transacción (3.11): el barrido
   * find-then-upsert por producto y el `touch` final son todo o nada, en vez
   * de N escrituras sueltas que podrían dejar el carrito a medio actualizar
   * si una falla a mitad de camino.
   */
  async bulkUpsertItems(cartId: number, entries: BulkUpsertEntry[]): Promise<void> {
    if (entries.length === 0) return;
    await this.dataSource.transaction(async (manager) => {
      for (const { productId, quantity } of entries) {
        const existing = await manager.findOne(CartItem, { where: { cartId, productId } });
        if (existing) {
          if (existing.quantity !== quantity) {
            await manager.update(CartItem, existing.id, { quantity });
          }
        } else {
          await manager.save(manager.create(CartItem, { cartId, productId, quantity }));
        }
      }
      await manager.update(ShoppingCart, cartId, { updatedAt: new Date() });
    });
  }
}
