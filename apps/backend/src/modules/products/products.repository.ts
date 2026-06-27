import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseRepository } from '../../common/repositories/base.repository';

import { Product } from './entities/product.entity';

import type { QueryProductsDto } from './dto/query-products.dto';
import type { PaginatedResult } from '@kore/shared';

/**
 * Mapa columna-ordenable → expresión SQL.
 * Propiedades JS (name, price, createdAt) ↔ columnas reales del schema.
 */
const SORT_COLUMNS: Record<QueryProductsDto['sortBy'], string> = {
  name: 'p.nombre',
  price: 'p.precio_base',
  createdAt: 'p.creado_en',
};

@Injectable()
export class ProductsRepository extends BaseRepository<Product, number> {
  constructor(
    @InjectRepository(Product)
    protected readonly repository: Repository<Product>,
  ) {
    super(repository);
  }

  /**
   * Catálogo público filtrable y paginado sobre la tabla `productos`.
   *
   * Búsqueda: `ILIKE` cubre substrings; `word_similarity` cubre typos.
   * Se usa word_similarity (no `%`/`similarity()`) porque compara contra
   * la palabra más similar del nombre, no el string completo — umbral 0.25.
   */
  async findCatalog(q: QueryProductsDto): Promise<PaginatedResult<Product>> {
    const qb = this.repository.createQueryBuilder('p').where('p.is_active = TRUE');

    if (q.categoryIds?.length) {
      qb.andWhere('p.id_categoria IN (:...categoryIds)', { categoryIds: q.categoryIds });
    }
    if (q.minPrice !== undefined) {
      qb.andWhere('p.precio_base >= :minPrice', { minPrice: q.minPrice });
    }
    if (q.maxPrice !== undefined) {
      qb.andWhere('p.precio_base <= :maxPrice', { maxPrice: q.maxPrice });
    }
    if (q.inStock) {
      qb.andWhere('p.stock_actual > 0');
    }

    if (q.vehicleBrand || q.vehicleModel || q.vehicleYear !== undefined) {
      // `compatibilidad` (singular) es la tabla correcta del modelo de datos:
      // FK real id_producto→productos, id_modelo→modelos. `compatibilidades`
      // (plural) es legado y NO debe usarse.
      const conditions = ['comp.id_producto = p.id_producto'];
      if (q.vehicleBrand) conditions.push('ma.nombre ILIKE :vehicleBrand');
      if (q.vehicleModel) conditions.push('mo.nombre ILIKE :vehicleModel');
      if (q.vehicleYear !== undefined) {
        // El año del vehículo debe caer dentro del rango de vigencia del
        // modelo (modelos.anio_inicio/anio_fin). Con vehicleYearTo se exige
        // que el rango seleccionado se solape con el del modelo.
        conditions.push(
          q.vehicleYearTo !== undefined
            ? 'mo.anio_inicio <= :vehicleYearTo AND mo.anio_fin >= :vehicleYear'
            : ':vehicleYear BETWEEN mo.anio_inicio AND mo.anio_fin',
        );
      }

      qb.andWhere(
        `EXISTS (
           SELECT 1 FROM compatibilidad comp
           INNER JOIN modelos mo ON mo.id_modelo = comp.id_modelo
           INNER JOIN marcas ma ON ma.id_marca = mo.id_marca
           WHERE ${conditions.join(' AND ')}
         )`,
        {
          vehicleBrand: q.vehicleBrand,
          vehicleModel: q.vehicleModel,
          vehicleYear: q.vehicleYear,
          vehicleYearTo: q.vehicleYearTo,
        },
      );
    }

    if (q.search) {
      qb.andWhere(
        '(p.nombre ILIKE :like OR p.sku ILIKE :like OR word_similarity(:search, p.nombre) >= 0.25)',
        { like: `%${q.search}%`, search: q.search },
      );
      qb.orderBy('word_similarity(:search, p.nombre)', 'DESC').addOrderBy('p.nombre', 'ASC');
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

  async findActiveById(id: number): Promise<Product | null> {
    return this.repository.findOne({ where: { id, isActive: true } });
  }

  async findLowStock(): Promise<Product[]> {
    return this.repository
      .createQueryBuilder('p')
      .where('p.stock_actual = 0')
      .andWhere('p.is_active = TRUE')
      .orderBy('p.stock_actual', 'ASC')
      .getMany();
  }

  /**
   * Obtiene un producto con sus imágenes y ficha técnica.
   * Usado para la página de detalles del producto.
   */
  async findByIdWithRelations(id: number): Promise<Product | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['images', 'technicalSheet'],
    });
  }
}
