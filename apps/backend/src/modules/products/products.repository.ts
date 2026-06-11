import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseRepository } from '../../common/repositories/base.repository';

import { Product } from './entities/product.entity';

import type { QueryProductsDto } from './dto/query-products.dto';
import type { PaginatedResult } from '@kore/shared';

/**
 * Mapa columna-ordenable → expresión SQL. Doble defensa contra inyección
 * en ORDER BY (el DTO ya restringe con @IsIn, pero nunca interpolamos
 * directamente el valor del cliente).
 */
const SORT_COLUMNS: Record<QueryProductsDto['sortBy'], string> = {
  name: 'p.name',
  price: 'p.price',
  createdAt: 'p.created_at',
};

/**
 * Repositorio concreto de productos.
 *
 * Operaciones del dominio que extienden el CRUD genérico:
 *   · `findBySku`           — clave única de inventario
 *   · `findCatalog`         — catálogo público filtrable y paginado
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

  /**
   * Catálogo público: combina filtros opcionales, búsqueda trigram y
   * paginación en una sola consulta.
   *
   * Búsqueda: `ILIKE` cubre substrings ("fil"); `word_similarity` cubre
   * typos ("flitro" → "Filtro de Aceite Premium"). Se usa word_similarity
   * y no `%`/`similarity()` porque esta compara contra el string COMPLETO:
   * un término corto contra un nombre largo nunca supera el umbral.
   * Umbral 0.25 calibrado con datos reales (typo de 1 letra ≈ 0.286).
   * Con search activo se ordena por relevancia.
   */
  async findCatalog(q: QueryProductsDto): Promise<PaginatedResult<Product>> {
    const qb = this.repository.createQueryBuilder('p').where('p.is_active = TRUE');

    if (q.categoryIds?.length) {
      qb.andWhere('p.category_id IN (:...categoryIds)', { categoryIds: q.categoryIds });
    }
    if (q.minPrice !== undefined) {
      qb.andWhere('p.price >= :minPrice', { minPrice: q.minPrice });
    }
    if (q.maxPrice !== undefined) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice: q.maxPrice });
    }
    if (q.inStock) {
      qb.andWhere('p.stock > 0');
    }

    if (q.search) {
      qb.andWhere(
        '(p.name ILIKE :like OR p.sku ILIKE :like OR word_similarity(:search, p.name) >= 0.25)',
        { like: `%${q.search}%`, search: q.search },
      );
      qb.orderBy('word_similarity(:search, p.name)', 'DESC').addOrderBy('p.name', 'ASC');
    } else {
      qb.orderBy(SORT_COLUMNS[q.sortBy], q.sortOrder.toUpperCase() as 'ASC' | 'DESC');
    }

    qb.skip((q.page - 1) * q.pageSize).take(q.pageSize);
    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    };
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
