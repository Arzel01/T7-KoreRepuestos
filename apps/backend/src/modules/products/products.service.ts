import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { SearchAnalyticsService } from '../analytics/search-analytics.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CategoriesService } from '../categories/categories.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductsRepository } from './products.repository';

import type { QueryProductsDto } from './dto/query-products.dto';
import type { SuggestProductsDto } from './dto/suggest-products.dto';
import type { ProductSuggestion } from './products.repository';
import type { PaginatedResult } from '@kore/shared';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesService: CategoriesService,
    private readonly auditLogService: AuditLogService,
    private readonly searchAnalytics: SearchAnalyticsService,
  ) {}

  async create(dto: CreateProductDto, userId?: number): Promise<Product> {
    this.assertPositive('price', dto.price);

    const skuTaken = await this.productsRepository.findBySku(dto.sku);
    if (skuTaken) {
      throw new ConflictException(`Ya existe un producto con SKU "${dto.sku}"`);
    }

    if (dto.categoryId) {
      await this.categoriesService.assertExists(dto.categoryId);
    }

    const product = await this.productsRepository.create({ ...dto });
    this.logger.log(`Producto creado: ${product.sku} (${product.id})`);

    await this.auditLogService.log({
      userId,
      tableName: 'productos',
      action: 'INSERT',
      description: `Producto ${product.sku} creado`,
    });

    return product;
  }

  async update(id: number, dto: UpdateProductDto, userId?: number): Promise<Product> {
    const existing = await this.productsRepository.findById(id);
    if (!existing) throw new NotFoundException('Producto no encontrado');

    if (dto.price !== undefined) this.assertPositive('price', dto.price);
    if (dto.categoryId !== undefined) {
      await this.categoriesService.assertExists(dto.categoryId);
    }

    const updated = await this.productsRepository.update(id, dto);

    await this.auditLogService.log({
      userId,
      tableName: 'productos',
      action: 'UPDATE',
      description: `Producto ${id} actualizado`,
    });

    return updated;
  }

  async remove(id: number, userId?: number): Promise<void> {
    const existing = await this.productsRepository.findById(id);
    if (!existing) throw new NotFoundException('Producto no encontrado');

    await this.productsRepository.update(id, { isActive: false });

    await this.auditLogService.log({
      userId,
      tableName: 'productos',
      action: 'DELETE',
      description: `Producto ${id} desactivado`,
    });
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productsRepository.findByIdWithRelations(id);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  async findActiveById(id: number): Promise<Product> {
    const product = await this.productsRepository.findActiveById(id);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  async findCatalog(query: QueryProductsDto, userId?: number): Promise<PaginatedResult<Product>> {
    const result = await this.productsRepository.findCatalog(query);
    if (query.search) {
      await this.searchAnalytics.log(query.search, result.total, userId).catch((err: unknown) => {
        this.logger.warn('Error al registrar búsqueda en analytics', err);
      });
    }
    return result;
  }

  async findSuggestions(dto: SuggestProductsDto): Promise<ProductSuggestion[]> {
    return this.productsRepository.findSuggestions(dto);
  }

  async findCompatibility(id: number): Promise<
    Array<{
      modelId: number;
      modelName: string;
      brandName: string;
      yearStart: number;
      yearEnd: number;
    }>
  > {
    const product = await this.productsRepository.findActiveById(id);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return this.productsRepository.findCompatibilityForProduct(id);
  }

  async addCompatibility(productId: number, modeloId: number, userId?: number): Promise<void> {
    const product = await this.productsRepository.findById(productId);
    if (!product) throw new NotFoundException('Producto no encontrado');

    const modeloOk = await this.productsRepository.modeloExists(modeloId);
    if (!modeloOk) throw new NotFoundException(`Modelo ${modeloId} no encontrado`);

    await this.productsRepository.addCompatibility(productId, modeloId);

    await this.auditLogService.log({
      userId,
      tableName: 'compatibilidad',
      action: 'INSERT',
      description: `Compatibilidad producto ${productId} ↔ modelo ${modeloId} agregada`,
    });
  }

  async removeCompatibility(productId: number, modeloId: number, userId?: number): Promise<void> {
    const product = await this.productsRepository.findById(productId);
    if (!product) throw new NotFoundException('Producto no encontrado');

    await this.productsRepository.removeCompatibility(productId, modeloId);

    await this.auditLogService.log({
      userId,
      tableName: 'compatibilidad',
      action: 'DELETE',
      description: `Compatibilidad producto ${productId} ↔ modelo ${modeloId} eliminada`,
    });
  }

  private assertPositive(field: string, value: number): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(`El campo ${field} debe ser mayor que cero`);
    }
  }
}
