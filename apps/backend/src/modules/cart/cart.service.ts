import { IVA_RATE, type CartItemResponse, type CartResponse } from '@kore/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';

import { CartRepository } from './cart.repository';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { BulkAddCartDto } from './dto/bulk-add-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItem } from './entities/cart-item.entity';
import { ShoppingCart } from './entities/shopping-cart.entity';

/** Redondeo monetario a 2 decimales evitando errores de coma flotante. */
function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function imageOf(product: Product): string | undefined {
  const images = product.images ?? [];
  return (images.find((img) => img.isPrimary) ?? images[0])?.url;
}

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepo: CartRepository,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  /** Carrito del usuario (lo crea si no existe) con totales calculados. */
  async getCart(userId: number): Promise<CartResponse> {
    const cart = await this.cartRepo.ensureCart(userId);
    return this.buildResponse(cart.id);
  }

  /**
   * US#18 — añade un producto. Prevención de duplicados: si el producto ya
   * está en el carrito, incrementa la cantidad en vez de crear otra línea.
   * Valida stock contra la cantidad resultante.
   */
  async addItem(userId: number, dto: AddCartItemDto): Promise<CartResponse> {
    const cart = await this.cartRepo.ensureCart(userId);
    const qty = dto.quantity ?? 1;
    const product = await this.requirePurchasableProduct(dto.productId);

    const existing = await this.cartRepo.findItem(cart.id, product.id);
    const nextQty = (existing?.quantity ?? 0) + qty;
    if (nextQty > product.stock) {
      throw new BadRequestException(
        `Stock insuficiente para «${product.name}»: disponibles ${product.stock}.`,
      );
    }

    if (existing) {
      await this.cartRepo.updateItemQuantity(existing.id, nextQty);
    } else {
      await this.cartRepo.saveItem({ cartId: cart.id, productId: product.id, quantity: qty });
    }
    await this.cartRepo.touch(cart.id);
    return this.buildResponse(cart.id);
  }

  /**
   * US#5 — alta masiva ("Agregar todos los repuestos"). Best-effort: ignora
   * productos inexistentes/inactivos y recorta cada cantidad al stock
   * disponible, para que un repuesto agotado no bloquee el resto del plan.
   */
  async bulkAdd(userId: number, dto: BulkAddCartDto): Promise<CartResponse> {
    const cart = await this.cartRepo.ensureCart(userId);

    // Consolida cantidades repetidas del payload en una sola por producto.
    const requested = new Map<number, number>();
    for (const item of dto.items) {
      requested.set(item.productId, (requested.get(item.productId) ?? 0) + (item.quantity ?? 1));
    }

    const products = await this.products.find({
      where: { id: In([...requested.keys()]), isActive: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    for (const [productId, addQty] of requested) {
      const product = byId.get(productId);
      if (!product || product.stock <= 0) continue;

      const existing = await this.cartRepo.findItem(cart.id, productId);
      const nextQty = Math.min((existing?.quantity ?? 0) + addQty, product.stock);
      if (existing) {
        if (nextQty !== existing.quantity) {
          await this.cartRepo.updateItemQuantity(existing.id, nextQty);
        }
      } else {
        await this.cartRepo.saveItem({ cartId: cart.id, productId, quantity: nextQty });
      }
    }
    await this.cartRepo.touch(cart.id);
    return this.buildResponse(cart.id);
  }

  /** US#19 — cambia la cantidad de una línea validando stock. */
  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto): Promise<CartResponse> {
    const item = await this.requireOwnedItem(userId, itemId);
    const product = await this.requirePurchasableProduct(item.productId);
    if (dto.quantity > product.stock) {
      throw new BadRequestException(
        `Stock insuficiente para «${product.name}»: disponibles ${product.stock}.`,
      );
    }
    await this.cartRepo.updateItemQuantity(item.id, dto.quantity);
    await this.cartRepo.touch(item.cartId);
    return this.buildResponse(item.cartId);
  }

  /** US#20 — elimina una línea del carrito. */
  async removeItem(userId: number, itemId: number): Promise<CartResponse> {
    const item = await this.requireOwnedItem(userId, itemId);
    await this.cartRepo.removeItem(item.id);
    await this.cartRepo.touch(item.cartId);
    return this.buildResponse(item.cartId);
  }

  /** Vacía por completo el carrito del usuario. */
  async clear(userId: number): Promise<CartResponse> {
    const cart = await this.cartRepo.ensureCart(userId);
    await this.cartRepo.clearItems(cart.id);
    await this.cartRepo.touch(cart.id);
    return this.buildResponse(cart.id);
  }

  // ─── helpers ────────────────────────────────────────────────────────────

  private async requirePurchasableProduct(productId: number): Promise<Product> {
    const product = await this.products.findOne({
      where: { id: productId },
      relations: { images: true },
    });
    if (!product || !product.isActive) {
      throw new NotFoundException('Producto no encontrado o no disponible');
    }
    return product;
  }

  private async requireOwnedItem(userId: number, itemId: number): Promise<CartItem> {
    const item = await this.cartRepo.findItemWithCart(itemId);
    if (!item) throw new NotFoundException('Ítem del carrito no encontrado');
    if (item.cart.userId !== userId) throw new ForbiddenException();
    return item;
  }

  private async buildResponse(cartId: number): Promise<CartResponse> {
    const cart = (await this.cartRepo.loadWithItems(cartId)) as ShoppingCart;
    const items: CartItemResponse[] = (cart.items ?? []).map((item) => {
      const unitPrice = money(item.product.price);
      return {
        id: item.id,
        productId: item.productId,
        sku: item.product.sku,
        name: item.product.name,
        imageUrl: imageOf(item.product),
        unitPrice,
        quantity: item.quantity,
        stock: item.product.stock,
        lineTotal: money(unitPrice * item.quantity),
      };
    });

    const subtotal = money(items.reduce((sum, i) => sum + i.lineTotal, 0));
    const tax = money(subtotal * IVA_RATE);
    const total = money(subtotal + tax);

    return {
      id: cart.id,
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      distinctCount: items.length,
      subtotal,
      taxRate: IVA_RATE,
      tax,
      total,
      updatedAt: cart.updatedAt.toISOString(),
    };
  }
}
