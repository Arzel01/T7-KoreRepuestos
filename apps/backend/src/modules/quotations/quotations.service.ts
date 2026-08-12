import {
  IVA_RATE,
  QuotationStatus,
  UserRole,
  type CreateQuotationPayload,
  type QuotationEmailResult,
  type QuotationItemResponse,
  type QuotationResponse,
  type QuotationSummaryResponse,
} from '@kore/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { CartService } from '../cart/cart.service';

import { QuotationPdfService } from './pdf/quotation-pdf.service';
import { QuotationMailerService } from './quotation-mailer.service';
import { QuotationsRepository } from './quotations.repository';

import type { Quotation } from './entities/quotation.entity';
import type { JwtPayload } from '../auth/dto/auth-response.dto';

/** Administrador y Asesor Comercial ven/gestionan las cotizaciones de todos los clientes. */
const STAFF_ROLES: string[] = [UserRole.ADMINISTRADOR, UserRole.ASESOR_COMERCIAL];

/** Redondeo monetario a 2 decimales evitando errores de coma flotante. */
function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

const DEFAULT_VALIDITY_DAYS = 15;

@Injectable()
export class QuotationsService {
  private readonly logger = new Logger(QuotationsService.name);

  constructor(
    private readonly repo: QuotationsRepository,
    private readonly cartService: CartService,
    private readonly pdfService: QuotationPdfService,
    private readonly mailer: QuotationMailerService,
  ) {}

  /**
   * US#22 — genera una cotización a partir del carrito vigente del usuario.
   *
   * Congela cada línea con su `precio_unitario` actual, calcula la fecha de
   * validez y opcionalmente envía el email y/o vacía el carrito. Rechaza si el
   * carrito está vacío (no tiene sentido cotizar la nada).
   */
  async create(userId: number, dto: CreateQuotationPayload): Promise<QuotationResponse> {
    const cart = await this.cartService.getCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío: no hay nada que cotizar.');
    }

    const validityDays = dto.validityDays ?? DEFAULT_VALIDITY_DAYS;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    const id = await this.repo.createWithItems(
      userId,
      validUntil,
      cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    );

    if (dto.sendEmail) {
      // El envío no debe tumbar la creación: se emite igual y se registra aparte.
      const created = await this.loadOwned(userId, id);
      const quotation = this.toResponse(created);
      await this.emailInternal(quotation).catch(() => undefined);
      await this.repo.updateStatus(id, QuotationStatus.ENVIADA);
    }

    if (dto.clearCart ?? true) {
      // La cotización ya está confirmada (3.11): un fallo al vaciar el
      // carrito no debe reportarse como error de creación — mismo criterio
      // que el envío de email arriba. Deja el carrito poblado, no corrupto.
      await this.cartService
        .clear(userId)
        .catch((err) => this.logger.warn(`No se pudo vaciar el carrito de ${userId}: ${err}`));
    }

    const finalEntity = await this.loadOwned(userId, id);
    return this.toResponse(finalEntity);
  }

  /**
   * Cotizaciones para historial/listado. Administrador y Asesor Comercial ven
   * las de todos los clientes (con el dato del cliente incluido, para poder
   * contactarlo); un cliente normal solo ve las suyas.
   */
  async list(requester: JwtPayload): Promise<QuotationSummaryResponse[]> {
    const staff = this.isStaff(requester);
    const rows = staff
      ? await this.repo.findAll()
      : await this.repo.findByUser(Number(requester.sub));

    return rows.map((q) => {
      const totals = this.computeTotals(q);
      return {
        id: q.id,
        number: q.number,
        status: this.statusOf(q),
        total: totals.total,
        itemCount: (q.items ?? []).reduce((sum, i) => sum + i.quantity, 0),
        issuedAt: q.issuedAt.toISOString(),
        validUntil: q.validUntil.toISOString(),
        expired: this.isExpired(q),
        ...(staff && {
          customer: {
            id: q.userId,
            name: q.user?.nombres ?? 'Cliente',
            email: q.user?.email ?? '',
          },
        }),
      };
    });
  }

  /** Cotización completa (con líneas y totales). Staff ve cualquiera; cliente solo la suya. */
  async findOne(requester: JwtPayload, id: number): Promise<QuotationResponse> {
    const entity = await this.loadForRequester(requester, id);
    return this.toResponse(entity);
  }

  /** Genera el PDF de la cotización. Staff ve cualquiera; cliente solo la suya. */
  async generatePdf(requester: JwtPayload, id: number): Promise<{ filename: string; pdf: Buffer }> {
    const entity = await this.loadForRequester(requester, id);
    const quotation = this.toResponse(entity);
    const pdf = await this.pdfService.render(quotation);
    return { filename: `${quotation.number}.pdf`, pdf };
  }

  /**
   * Envía la cotización por email con el PDF adjunto. Staff puede reenviarla
   * a cualquier cliente — es la vía para "cerrar la venta" desde el panel.
   */
  async email(requester: JwtPayload, id: number): Promise<QuotationEmailResult> {
    const entity = await this.loadForRequester(requester, id);
    const quotation = this.toResponse(entity);
    const result = await this.emailInternal(quotation);
    await this.repo.updateStatus(id, QuotationStatus.ENVIADA);
    return result;
  }

  // ─── helpers ────────────────────────────────────────────────────────────

  private isStaff(requester: JwtPayload): boolean {
    return STAFF_ROLES.includes(requester.role);
  }

  private async emailInternal(quotation: QuotationResponse): Promise<QuotationEmailResult> {
    const pdf = await this.pdfService.render(quotation);
    return this.mailer.send(quotation, pdf);
  }

  private async loadOwned(userId: number, id: number): Promise<Quotation> {
    const entity = await this.repo.findByIdWithRelations(id);
    if (!entity) throw new NotFoundException('Cotización no encontrada');
    if (entity.userId !== userId) throw new ForbiddenException();
    return entity;
  }

  /** Como loadOwned, pero Administrador/Asesor Comercial no necesitan ser el dueño. */
  private async loadForRequester(requester: JwtPayload, id: number): Promise<Quotation> {
    if (this.isStaff(requester)) {
      const entity = await this.repo.findByIdWithRelations(id);
      if (!entity) throw new NotFoundException('Cotización no encontrada');
      return entity;
    }
    return this.loadOwned(Number(requester.sub), id);
  }

  private computeTotals(q: Quotation): { subtotal: number; tax: number; total: number } {
    const subtotal = money((q.items ?? []).reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));
    const tax = money(subtotal * IVA_RATE);
    return { subtotal, tax, total: money(subtotal + tax) };
  }

  private isExpired(q: Quotation): boolean {
    return q.validUntil.getTime() < Date.now();
  }

  /** Estado efectivo: si ya venció, se reporta EXPIRADA sin tocar la DB. */
  private statusOf(q: Quotation): QuotationStatus {
    if (this.isExpired(q) && q.status === QuotationStatus.PENDIENTE) {
      return QuotationStatus.EXPIRADA;
    }
    return (q.status as QuotationStatus) ?? QuotationStatus.PENDIENTE;
  }

  private toResponse(q: Quotation): QuotationResponse {
    const items: QuotationItemResponse[] = (q.items ?? []).map((it) => {
      const unitPrice = money(it.unitPrice);
      return {
        id: it.id,
        productId: it.productId,
        sku: it.product?.sku ?? String(it.productId),
        name: it.product?.name ?? 'Producto',
        quantity: it.quantity,
        unitPrice,
        lineTotal: money(unitPrice * it.quantity),
      };
    });
    const totals = this.computeTotals(q);

    return {
      id: q.id,
      number: q.number,
      status: this.statusOf(q),
      customer: {
        id: q.userId,
        name: q.user?.nombres ?? 'Cliente',
        email: q.user?.email ?? '',
      },
      items,
      subtotal: totals.subtotal,
      taxRate: IVA_RATE,
      tax: totals.tax,
      total: totals.total,
      issuedAt: q.issuedAt.toISOString(),
      validUntil: q.validUntil.toISOString(),
      expired: this.isExpired(q),
    };
  }
}
