import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { QuotationItem } from './entities/quotation-item.entity';
import { Quotation } from './entities/quotation.entity';

/** Datos de una línea a persistir al crear la cotización. */
export interface NewQuotationItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

@Injectable()
export class QuotationsRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Quotation) private readonly quotations: Repository<Quotation>,
  ) {}

  /**
   * Crea la cotización y sus líneas en una sola transacción y le asigna el
   * correlativo `COT-<año>-<id de 6 dígitos>`.
   *
   * El correlativo depende del id autoincremental (garantiza unicidad sin una
   * secuencia aparte ni condiciones de carrera): primero se inserta la cabecera
   * con un número provisional, luego se actualiza con el id definitivo.
   */
  async createWithItems(
    userId: number,
    validUntil: Date,
    items: NewQuotationItem[],
  ): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const header = manager.create(Quotation, {
        // Provisional: se reemplaza por el correlativo definitivo abajo.
        number: `PENDING-${userId}-${validUntil.getTime()}`,
        userId,
        validUntil,
        status: 'Pendiente',
      });
      const saved = await manager.save(header);

      const year = saved.issuedAt.getFullYear();
      saved.number = `COT-${year}-${String(saved.id).padStart(6, '0')}`;
      await manager.update(Quotation, saved.id, { number: saved.number });

      const rows = items.map((it) =>
        manager.create(QuotationItem, {
          quotationId: saved.id,
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        }),
      );
      await manager.save(rows);

      return saved.id;
    });
  }

  /** Carga una cotización con sus líneas, productos y el usuario dueño. */
  findByIdWithRelations(id: number): Promise<Quotation | null> {
    return this.quotations.findOne({
      where: { id },
      relations: { user: true, items: { product: true } },
      order: { items: { id: 'ASC' } },
    });
  }

  /** Cotizaciones de un usuario (más recientes primero), con sus líneas. */
  findByUser(userId: number): Promise<Quotation[]> {
    return this.quotations.find({
      where: { userId },
      relations: { items: true },
      order: { issuedAt: 'DESC', id: 'DESC' },
    });
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await this.quotations.update(id, { status });
  }
}
