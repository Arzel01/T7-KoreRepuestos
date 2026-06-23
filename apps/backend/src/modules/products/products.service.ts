import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { AuditLogService } from '../audit/audit-log.service';
import { CategoriesService } from '../categories/categories.service';

import { CreateImageDto } from './dto/create-image.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductsRepository } from './products.repository';

import type { QueryProductsDto } from './dto/query-products.dto';
import type { PaginatedResult } from '@kore/shared';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesService: CategoriesService,
    private readonly auditLogService: AuditLogService,
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

  async findCatalog(query: QueryProductsDto): Promise<PaginatedResult<Product>> {
    return this.productsRepository.findCatalog(query);
  }

  async deactivate(id: number): Promise<Product> {
    await this.findById(id); // 404 si no existe o ya está inactivo
    const updated = await this.productsRepository.update(id, {
      isActive: false,
    } as Partial<Product>);
    this.logger.log(`Producto desactivado: ${updated.sku} (${updated.id})`);
    return updated;
  }

  private assertPositive(field: string, value: number): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(`El campo ${field} debe ser mayor que cero`);
    }
  }

  async create_image(id: number, dto: CreateImageDto): Promise<Product> {
    const product = await this.findById(id);

    const updatedProduct = await this.productsRepository.addImage(
      product.id,
      dto.url_imagen,
      dto.es_principal,
    );
    this.logger.log(`Imagen agregada al producto ${product.sku} (${product.id})`);
    return updatedProduct;
  }
}
