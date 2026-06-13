import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { CategoriesService } from '../categories/categories.service';

import { CreateProductDto } from './dto/create-product.dto';
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
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
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
    return product;
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  async findCatalog(query: QueryProductsDto): Promise<PaginatedResult<Product>> {
    return this.productsRepository.findCatalog(query);
  }

  private assertPositive(field: string, value: number): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(`El campo ${field} debe ser mayor que cero`);
    }
  }
}
