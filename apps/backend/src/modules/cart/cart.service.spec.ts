import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { CartService } from './cart.service';

import type { CartRepository } from './cart.repository';
import type { CartItem } from './entities/cart-item.entity';
import type { ShoppingCart } from './entities/shopping-cart.entity';
import type { Product } from '../products/entities/product.entity';
import type { Repository } from 'typeorm';

/**
 * Tests unitarios de CartService (US#18–US#20 + cálculos de IVA).
 * Repositorios mockeados: no requieren Postgres → corren en la suite unit de CI
 * (arquitectura Postgres-nativa, sin dependencias externas).
 */
describe('CartService', () => {
  let service: CartService;
  let cartRepo: jest.Mocked<CartRepository>;
  let products: { findOne: jest.Mock; find: jest.Mock };

  const USER_ID = 7;
  const CART_ID = 1;

  function product(overrides: Partial<Product> = {}): Product {
    return {
      id: 5,
      sku: 'SKU-5',
      name: 'Filtro de aceite',
      price: 20,
      stock: 10,
      isActive: true,
      images: [{ url: 'http://img/5.png', isPrimary: true }],
      ...overrides,
    } as unknown as Product;
  }

  /** Construye el carrito que devolverá `loadWithItems` (para el builder de totales). */
  function cartWith(items: Array<Partial<CartItem> & { product: Product }>): ShoppingCart {
    return {
      id: CART_ID,
      userId: USER_ID,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      items: items.map((it, i) => ({
        id: it.id ?? i + 1,
        cartId: CART_ID,
        productId: it.product.id,
        quantity: it.quantity ?? 1,
        product: it.product,
      })),
    } as unknown as ShoppingCart;
  }

  beforeEach(() => {
    cartRepo = {
      ensureCart: jest.fn().mockResolvedValue({ id: CART_ID, userId: USER_ID }),
      loadWithItems: jest.fn(),
      findItem: jest.fn(),
      findItemWithCart: jest.fn(),
      saveItem: jest.fn().mockResolvedValue({}),
      updateItemQuantity: jest.fn().mockResolvedValue(undefined),
      removeItem: jest.fn().mockResolvedValue(undefined),
      clearItems: jest.fn().mockResolvedValue(undefined),
      touch: jest.fn().mockResolvedValue(undefined),
      bulkUpsertItems: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CartRepository>;

    products = { findOne: jest.fn(), find: jest.fn() };

    service = new CartService(cartRepo, products as unknown as Repository<Product>);
  });

  describe('getCart · cálculos (subtotal, IVA, total)', () => {
    it('calcula subtotal, IVA (18%) y total correctamente', async () => {
      cartRepo.loadWithItems.mockResolvedValue(
        cartWith([
          { quantity: 2, product: product({ id: 5, price: 100 }) },
          { quantity: 1, product: product({ id: 6, price: 50, sku: 'SKU-6' }) },
        ]),
      );

      const cart = await service.getCart(USER_ID);

      expect(cart.subtotal).toBe(250);
      expect(cart.taxRate).toBe(0.18);
      expect(cart.tax).toBe(45); // 250 * 0.18
      expect(cart.total).toBe(295);
      expect(cart.itemCount).toBe(3); // suma de cantidades
      expect(cart.distinctCount).toBe(2); // líneas
      expect(cart.items[0].lineTotal).toBe(200);
    });

    it('redondea el IVA a 2 decimales', async () => {
      cartRepo.loadWithItems.mockResolvedValue(
        cartWith([{ quantity: 1, product: product({ price: 99.99 }) }]),
      );
      const cart = await service.getCart(USER_ID);
      expect(cart.subtotal).toBe(99.99);
      expect(cart.tax).toBe(18); // 99.99 * 0.18 = 17.9982 → 18.00
      expect(cart.total).toBe(117.99);
    });
  });

  describe('addItem · US#18', () => {
    it('crea una línea nueva cuando el producto no está en el carrito', async () => {
      products.findOne.mockResolvedValue(product({ stock: 10, price: 20 }));
      cartRepo.findItem.mockResolvedValue(null);
      cartRepo.loadWithItems.mockResolvedValue(
        cartWith([{ quantity: 3, product: product({ price: 20 }) }]),
      );

      await service.addItem(USER_ID, { productId: 5, quantity: 3 });

      expect(cartRepo.saveItem).toHaveBeenCalledWith({
        cartId: CART_ID,
        productId: 5,
        quantity: 3,
      });
      expect(cartRepo.updateItemQuantity).not.toHaveBeenCalled();
      expect(cartRepo.touch).toHaveBeenCalledWith(CART_ID);
    });

    it('previene duplicados: incrementa la cantidad si el producto ya existe', async () => {
      products.findOne.mockResolvedValue(product({ stock: 10 }));
      cartRepo.findItem.mockResolvedValue({ id: 9, quantity: 2 } as CartItem);
      cartRepo.loadWithItems.mockResolvedValue(
        cartWith([{ id: 9, quantity: 3, product: product() }]),
      );

      await service.addItem(USER_ID, { productId: 5, quantity: 1 });

      expect(cartRepo.updateItemQuantity).toHaveBeenCalledWith(9, 3);
      expect(cartRepo.saveItem).not.toHaveBeenCalled();
    });

    it('usa cantidad 1 por defecto cuando se omite', async () => {
      products.findOne.mockResolvedValue(product({ stock: 10 }));
      cartRepo.findItem.mockResolvedValue(null);
      cartRepo.loadWithItems.mockResolvedValue(cartWith([{ quantity: 1, product: product() }]));

      await service.addItem(USER_ID, { productId: 5 });

      expect(cartRepo.saveItem).toHaveBeenCalledWith(expect.objectContaining({ quantity: 1 }));
    });

    it('rechaza si la cantidad resultante supera el stock', async () => {
      products.findOne.mockResolvedValue(product({ stock: 2 }));
      cartRepo.findItem.mockResolvedValue({ id: 9, quantity: 2 } as CartItem);

      await expect(service.addItem(USER_ID, { productId: 5, quantity: 1 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(cartRepo.updateItemQuantity).not.toHaveBeenCalled();
    });

    it('rechaza si el producto no existe o está inactivo', async () => {
      products.findOne.mockResolvedValue(null);
      await expect(service.addItem(USER_ID, { productId: 99 })).rejects.toBeInstanceOf(
        NotFoundException,
      );

      products.findOne.mockResolvedValue(product({ isActive: false }));
      await expect(service.addItem(USER_ID, { productId: 5 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateItem · US#19', () => {
    it('actualiza la cantidad validando stock', async () => {
      cartRepo.findItemWithCart.mockResolvedValue({
        id: 9,
        cartId: CART_ID,
        productId: 5,
        cart: { userId: USER_ID },
      } as CartItem);
      products.findOne.mockResolvedValue(product({ stock: 10 }));
      cartRepo.loadWithItems.mockResolvedValue(
        cartWith([{ id: 9, quantity: 5, product: product() }]),
      );

      await service.updateItem(USER_ID, 9, { quantity: 5 });

      expect(cartRepo.updateItemQuantity).toHaveBeenCalledWith(9, 5);
    });

    it('rechaza cantidad mayor al stock', async () => {
      cartRepo.findItemWithCart.mockResolvedValue({
        id: 9,
        cartId: CART_ID,
        productId: 5,
        cart: { userId: USER_ID },
      } as CartItem);
      products.findOne.mockResolvedValue(product({ stock: 5 }));

      await expect(service.updateItem(USER_ID, 9, { quantity: 6 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('prohíbe modificar un ítem de otro usuario', async () => {
      cartRepo.findItemWithCart.mockResolvedValue({
        id: 9,
        cart: { userId: 999 },
      } as CartItem);

      await expect(service.updateItem(USER_ID, 9, { quantity: 1 })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('404 si el ítem no existe', async () => {
      cartRepo.findItemWithCart.mockResolvedValue(null);
      await expect(service.updateItem(USER_ID, 123, { quantity: 1 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('removeItem · US#20', () => {
    it('elimina un ítem propio', async () => {
      cartRepo.findItemWithCart.mockResolvedValue({
        id: 9,
        cartId: CART_ID,
        cart: { userId: USER_ID },
      } as CartItem);
      cartRepo.loadWithItems.mockResolvedValue(cartWith([]));

      const cart = await service.removeItem(USER_ID, 9);

      expect(cartRepo.removeItem).toHaveBeenCalledWith(9);
      expect(cart.items).toHaveLength(0);
      expect(cart.subtotal).toBe(0);
    });

    it('prohíbe eliminar un ítem ajeno', async () => {
      cartRepo.findItemWithCart.mockResolvedValue({ id: 9, cart: { userId: 999 } } as CartItem);
      await expect(service.removeItem(USER_ID, 9)).rejects.toBeInstanceOf(ForbiddenException);
      expect(cartRepo.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('bulkAdd · US#5', () => {
    it('consolida cantidades repetidas y recorta al stock disponible', async () => {
      products.find.mockResolvedValue([
        product({ id: 5, stock: 10, price: 20 }),
        product({ id: 6, stock: 4, price: 30, sku: 'SKU-6' }),
      ]);
      cartRepo.findItem.mockResolvedValue(null);
      cartRepo.loadWithItems.mockResolvedValue(cartWith([]));

      await service.bulkAdd(USER_ID, {
        items: [
          { productId: 5, quantity: 2 },
          { productId: 5, quantity: 1 }, // se consolida → 3
          { productId: 6, quantity: 100 }, // se recorta a stock 4
        ],
      });

      expect(cartRepo.bulkUpsertItems).toHaveBeenCalledWith(CART_ID, [
        { productId: 5, quantity: 3 },
        { productId: 6, quantity: 4 },
      ]);
    });

    it('ignora productos inexistentes/inactivos (no devueltos por el find)', async () => {
      products.find.mockResolvedValue([]); // ninguno activo
      cartRepo.loadWithItems.mockResolvedValue(cartWith([]));

      await service.bulkAdd(USER_ID, { items: [{ productId: 999, quantity: 1 }] });

      expect(cartRepo.bulkUpsertItems).toHaveBeenCalledWith(CART_ID, []);
    });
  });

  describe('clear', () => {
    it('vacía el carrito', async () => {
      cartRepo.loadWithItems.mockResolvedValue(cartWith([]));
      await service.clear(USER_ID);
      expect(cartRepo.clearItems).toHaveBeenCalledWith(CART_ID);
    });
  });
});
