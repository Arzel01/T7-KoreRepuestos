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

/**
 * Servicio de dominio del catálogo.
 *
 * Centraliza las invariantes de negocio que no caben en un DTO:
 *   · El SKU debe ser único globalmente.
 *   · La categoría referenciada debe existir.
 *   · Las reglas matemáticas (margen, low stock) viven en la entidad.
 *
 * Cualquier mutación pasa por aquí — los repositorios solo persisten.
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    // Defensa en profundidad — el DTO ya valida >0 a nivel de transporte,
    // pero re-verificamos aquí para que la regla viva en el dominio (testable
    // sin levantar HTTP) y para protegernos si el endpoint cambiase.
    this.assertPositive('price', dto.price);
    this.assertPositive('stock', dto.stock);
    if (dto.cost !== undefined) {
      this.assertPositive('cost', dto.cost);
    }

    const skuTaken = await this.productsRepository.findBySku(dto.sku);
    if (skuTaken) {
      throw new ConflictException(`Ya existe un producto con SKU "${dto.sku}"`);
    }

    if (dto.categoryId) {
      await this.categoriesService.assertExists(dto.categoryId);
    }

    const product = await this.productsRepository.create({
      ...dto,
      minStock: dto.minStock ?? 0,
    });

    this.logger.log(`Producto creado: ${product.sku} (${product.id})`);
    return product;
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.findAll({ isActive: true });
  }

  // ----------------------------------------------------------------------
  // Guards privados de invariantes (la entidad podría exponerlos, pero
  // mantenerlos aquí permite reutilizarlos en updates futuros sin tocarla).
  // ----------------------------------------------------------------------
  private assertPositive(field: string, value: number): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(`El campo ${field} debe ser mayor que cero`);
    }
  }
}
