import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { QuotationsService } from './quotations.service';

import type { Quotation } from './entities/quotation.entity';
import type { QuotationPdfService } from './pdf/quotation-pdf.service';
import type { QuotationMailerService } from './quotation-mailer.service';
import type { QuotationsRepository } from './quotations.repository';
import type { CartService } from '../cart/cart.service';
import type { CartResponse } from '@kore/shared';

/**
 * Tests unitarios de QuotationsService (US#22).
 *
 * Todo mockeado (repo, carrito, PDF, mailer): sin Postgres ni SMTP → corren en
 * la suite unit de CI (arquitectura Postgres-nativa, ver
 * [[project_postgres_native_infra]]).
 */
describe('QuotationsService', () => {
  let service: QuotationsService;
  let repo: jest.Mocked<QuotationsRepository>;
  let cartService: { getCart: jest.Mock; clear: jest.Mock };
  let pdf: { render: jest.Mock };
  let mailer: { send: jest.Mock };

  const USER_ID = 7;

  function cart(items: CartResponse['items'] = []): CartResponse {
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    return {
      id: 1,
      items,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      distinctCount: items.length,
      subtotal,
      taxRate: 0.18,
      tax: subtotal * 0.18,
      total: subtotal * 1.18,
      updatedAt: '2026-08-01T00:00:00.000Z',
    };
  }

  function cartItem(over: Partial<CartResponse['items'][number]>): CartResponse['items'][number] {
    return {
      id: 1,
      productId: 5,
      sku: 'SKU-5',
      name: 'Filtro',
      unitPrice: 100,
      quantity: 2,
      stock: 10,
      lineTotal: 200,
      ...over,
    };
  }

  /** Entidad Quotation tal como la devolvería el repo (con relaciones). */
  function quotationEntity(over: Partial<Quotation> = {}): Quotation {
    const future = new Date(Date.now() + 15 * 86_400_000);
    return {
      id: 42,
      number: 'COT-2026-000042',
      userId: USER_ID,
      issuedAt: new Date('2026-08-01T00:00:00.000Z'),
      validUntil: future,
      status: 'Pendiente',
      user: { id: USER_ID, nombres: 'Ana Cliente', email: 'ana@kore.dev' },
      items: [
        {
          id: 1,
          quotationId: 42,
          productId: 5,
          quantity: 2,
          unitPrice: 100,
          product: { id: 5, sku: 'SKU-5', name: 'Filtro' },
        },
      ],
      ...over,
    } as unknown as Quotation;
  }

  beforeEach(() => {
    repo = {
      createWithItems: jest.fn().mockResolvedValue(42),
      findByIdWithRelations: jest.fn(),
      findByUser: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<QuotationsRepository>;

    cartService = {
      getCart: jest.fn(),
      clear: jest.fn().mockResolvedValue(undefined),
    };
    pdf = { render: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4')) };
    mailer = { send: jest.fn().mockResolvedValue({ to: 'ana@kore.dev', delivered: false }) };

    service = new QuotationsService(
      repo,
      cartService as unknown as CartService,
      pdf as unknown as QuotationPdfService,
      mailer as unknown as QuotationMailerService,
    );
  });

  describe('create · US#22', () => {
    it('rechaza si el carrito está vacío', async () => {
      cartService.getCart.mockResolvedValue(cart([]));
      await expect(service.create(USER_ID, {})).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.createWithItems).not.toHaveBeenCalled();
    });

    it('congela los precios del carrito como líneas de la cotización', async () => {
      cartService.getCart.mockResolvedValue(
        cart([cartItem({ productId: 5, quantity: 2, unitPrice: 100 })]),
      );
      repo.findByIdWithRelations.mockResolvedValue(quotationEntity());

      await service.create(USER_ID, { clearCart: false });

      expect(repo.createWithItems).toHaveBeenCalledWith(USER_ID, expect.any(Date), [
        { productId: 5, quantity: 2, unitPrice: 100 },
      ]);
    });

    it('vacía el carrito por defecto tras emitir', async () => {
      cartService.getCart.mockResolvedValue(cart([cartItem({})]));
      repo.findByIdWithRelations.mockResolvedValue(quotationEntity());

      await service.create(USER_ID, {});
      expect(cartService.clear).toHaveBeenCalledWith(USER_ID);
    });

    it('no vacía el carrito si clearCart=false', async () => {
      cartService.getCart.mockResolvedValue(cart([cartItem({})]));
      repo.findByIdWithRelations.mockResolvedValue(quotationEntity());

      await service.create(USER_ID, { clearCart: false });
      expect(cartService.clear).not.toHaveBeenCalled();
    });

    it('envía email y marca como Enviada cuando sendEmail=true', async () => {
      cartService.getCart.mockResolvedValue(cart([cartItem({})]));
      repo.findByIdWithRelations.mockResolvedValue(quotationEntity());

      await service.create(USER_ID, { sendEmail: true, clearCart: false });

      expect(mailer.send).toHaveBeenCalled();
      expect(repo.updateStatus).toHaveBeenCalledWith(42, 'Enviada');
    });

    it('calcula totales con IVA 18% en la respuesta', async () => {
      cartService.getCart.mockResolvedValue(
        cart([cartItem({ quantity: 2, unitPrice: 100, lineTotal: 200 })]),
      );
      repo.findByIdWithRelations.mockResolvedValue(quotationEntity());

      const res = await service.create(USER_ID, { clearCart: false });

      expect(res.subtotal).toBe(200);
      expect(res.tax).toBe(36); // 200 * 0.18
      expect(res.total).toBe(236);
      expect(res.taxRate).toBe(0.18);
      expect(res.customer.email).toBe('ana@kore.dev');
    });
  });

  describe('findOne · propiedad', () => {
    it('404 si no existe', async () => {
      repo.findByIdWithRelations.mockResolvedValue(null);
      await expect(service.findOne(USER_ID, 1)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('prohíbe ver la cotización de otro usuario', async () => {
      repo.findByIdWithRelations.mockResolvedValue(quotationEntity({ userId: 999 }));
      await expect(service.findOne(USER_ID, 42)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('estado efectivo · expiración', () => {
    it('reporta EXPIRADA si la validez ya pasó', async () => {
      repo.findByIdWithRelations.mockResolvedValue(
        quotationEntity({ validUntil: new Date(Date.now() - 86_400_000) }),
      );
      const res = await service.findOne(USER_ID, 42);
      expect(res.expired).toBe(true);
      expect(res.status).toBe('Expirada');
    });
  });

  describe('generatePdf', () => {
    it('renderiza el PDF de una cotización propia', async () => {
      repo.findByIdWithRelations.mockResolvedValue(quotationEntity());
      const { filename, pdf: buffer } = await service.generatePdf(USER_ID, 42);
      expect(filename).toBe('COT-2026-000042.pdf');
      expect(buffer.length).toBeGreaterThan(0);
      expect(pdf.render).toHaveBeenCalled();
    });
  });
});
