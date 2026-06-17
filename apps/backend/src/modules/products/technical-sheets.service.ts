import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLogService } from '../audit/audit-log.service';

import { CreateTechnicalSheetEntryDto } from './dto/create-technical-sheet-entry.dto';
import { TechnicalSheetEntry } from './entities/technical-sheet-entry.entity';
import { ProductsRepository } from './products.repository';

@Injectable()
export class TechnicalSheetsService {
  constructor(
    @InjectRepository(TechnicalSheetEntry)
    private readonly entryRepo: Repository<TechnicalSheetEntry>,
    private readonly productsRepository: ProductsRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findByProduct(productId: number): Promise<TechnicalSheetEntry[]> {
    return this.entryRepo.find({ where: { productId }, order: { id: 'ASC' } });
  }

  async create(
    productId: number,
    dto: CreateTechnicalSheetEntryDto,
    userId: number,
  ): Promise<TechnicalSheetEntry> {
    const product = await this.productsRepository.findById(productId);
    if (!product) throw new NotFoundException('Producto no encontrado');

    const entry = this.entryRepo.create({ productId, attribute: dto.attribute, value: dto.value });
    const saved = await this.entryRepo.save(entry);

    await this.auditLogService.log({
      userId,
      tableName: 'fichas_tecnicas',
      action: 'INSERT',
      description: `Entrada ${saved.id} (${dto.attribute}) añadida al producto ${productId}`,
    });

    return saved;
  }

  async remove(productId: number, entryId: number, userId: number): Promise<void> {
    const entry = await this.entryRepo.findOne({ where: { id: entryId, productId } });
    if (!entry) throw new NotFoundException('Entrada de ficha técnica no encontrada');

    await this.entryRepo.delete(entryId);

    await this.auditLogService.log({
      userId,
      tableName: 'fichas_tecnicas',
      action: 'DELETE',
      description: `Entrada ${entryId} eliminada del producto ${productId}`,
    });
  }
}
