import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseRepository } from '../../common/repositories/base.repository';

import { Product } from './entities/product.entity';

/**
 * Repositorio concreto de productos.
 *
 * Operaciones del dominio que extienden el CRUD genérico:
 *   · `findBySku`           — clave única de inventario
 *   · `searchByName`        — búsqueda por similitud usando pg_trgm
 *   · `findLowStock`        — alertas de reposición
 */
@Injectable()
export class ProductsRepository extends BaseRepository<Product> {
  constructor(
    @InjectRepository(Product)
    protected readonly repository: Repository<Product>,
  ) {
    super(repository);
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.repository.findOne({ where: { sku } });
  }

  /**
   * Búsqueda con índice GIN sobre `name` (extensión pg_trgm).
   * Soporta typos leves — útil para search-as-you-type.
   */
  async searchByName(term: string, limit = 20): Promise<Product[]> {
    return this.repository
      .createQueryBuilder('p')
      .where('p.name % :term', { term })
      .andWhere('p.is_active = TRUE')
      .orderBy('similarity(p.name, :term)', 'DESC')
      .limit(limit)
      .getMany();
  }

  /** Productos cuyo stock está por debajo del mínimo configurado. */
  async findLowStock(): Promise<Product[]> {
    return this.repository
      .createQueryBuilder('p')
      .where('p.stock <= p.min_stock')
      .andWhere('p.is_active = TRUE')
      .orderBy('p.stock', 'ASC')
      .getMany();
  }
}
