import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseRepository } from '../../common/repositories/base.repository';

import { Product } from './entities/product.entity';

import type { QueryProductsDto } from './dto/query-products.dto';
import type { SuggestProductsDto } from './dto/suggest-products.dto';
import type { PaginatedResult } from '@kore/shared';

export interface ProductSuggestion {
  id: number;
  name: string;
  sku: string;
  price: number;
}

/** Producto del catálogo con el fragmento resaltado (`ts_headline`) del match. */
export type ProductWithHighlight = Product & { highlight?: string };

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
   *
   * `searchTerms` (término original + sinónimos del dominio, resueltos por
   * `SynonymsService`) amplía el match y el ranking sin depender de un motor
   * externo — ver ADR-0001. Cuando hay búsqueda, cada ítem incluye `highlight`
   * (`ts_headline`) con el nombre resaltado (`<mark>…</mark>`).
   */
  async findCatalog(
    q: QueryProductsDto,
    searchTerms?: string[],
  ): Promise<PaginatedResult<ProductWithHighlight>> {
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

    // Término original + sinónimos. Cada término aporta su propio tsquery,
    // que se combinan con el operador `||` de tsquery (unión) para match,
    // ranking y highlighting.
    const terms = q.search ? (searchTerms?.length ? searchTerms : [q.search]) : [];

    if (terms.length) {
      const params: Record<string, string> = {};
      terms.forEach((term, i) => {
        params[`s${i}`] = term;
        params[`like${i}`] = `%${term}%`;
      });
      const tsquery = terms.map((_, i) => `websearch_to_tsquery('spanish', :s${i})`).join(' || ');
      const likeMatch = terms
        .map((_, i) => `p.nombre ILIKE :like${i} OR p.sku ILIKE :like${i}`)
        .join(' OR ');
      const simMatch = terms
        .map((_, i) => `word_similarity(:s${i}, p.nombre) >= 0.25`)
        .join(' OR ');

      qb.andWhere(`(p.search_vector @@ (${tsquery}) OR ${likeMatch} OR ${simMatch})`, params);
      qb.addSelect(
        `ts_headline('spanish', p.nombre, ${tsquery}, 'StartSel=<mark>,StopSel=</mark>,HighlightAll=TRUE')`,
        'highlight',
      );
      qb.orderBy(`ts_rank(p.search_vector, (${tsquery}))`, 'DESC')
        // El término primario (s0) domina el desempate por similitud.
        .addOrderBy('word_similarity(:s0, p.nombre)', 'DESC')
        .addOrderBy('p.nombre', 'ASC');
    } else {
      qb.orderBy(SORT_COLUMNS[q.sortBy], q.sortOrder.toUpperCase() as 'ASC' | 'DESC');
    }

    // getCount() ignora SELECT/ORDER, así que cuenta el total antes de paginar.
    const total = await qb.getCount();
    qb.skip((q.page - 1) * q.pageSize).take(q.pageSize);

    let items: ProductWithHighlight[];
    if (terms.length) {
      const { entities, raw } = await qb.getRawAndEntities<Record<string, string>>();
      items = entities.map((entity, i) => {
        (entity as ProductWithHighlight).highlight = raw[i]?.highlight ?? undefined;
        return entity as ProductWithHighlight;
      });
    } else {
      items = await qb.getMany();
    }

    return {
      items,
      total,
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    };
  }

  async findSuggestions(
    dto: SuggestProductsDto,
    searchTerms?: string[],
  ): Promise<ProductSuggestion[]> {
    const terms = searchTerms?.length ? searchTerms : [dto.q];

    const params: unknown[] = [];
    const orClauses = terms.map((term) => {
      const prefixIdx = params.push(`${term}%`);
      const simIdx = params.push(term);
      return `(p.nombre ILIKE $${prefixIdx} OR p.sku ILIKE $${prefixIdx} OR word_similarity($${simIdx}, p.nombre) >= 0.3)`;
    });

    // El orden prioriza el término primario (lo que el usuario tecleó).
    const primaryPrefixIdx = params.push(`${dto.q}%`);
    const primarySimIdx = params.push(dto.q);
    const limitIdx = params.push(dto.limit);

    return this.repository.manager.query<ProductSuggestion[]>(
      `SELECT p.id_producto AS id, p.nombre AS name, p.sku, p.precio_base AS price
       FROM public.productos p
       WHERE p.is_active = TRUE AND (${orClauses.join(' OR ')})
       ORDER BY (p.nombre ILIKE $${primaryPrefixIdx}) DESC,
                word_similarity($${primarySimIdx}, p.nombre) DESC,
                p.nombre ASC
       LIMIT $${limitIdx}`,
      params,
    );
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.repository.findOne({ where: { sku } });
  }

  async findActiveById(id: number): Promise<Product | null> {
    return this.repository.findOne({
      where: { id, isActive: true },
      relations: ['images', 'technicalSheet'],
    });
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

  async findCompatibilityForProduct(productId: number): Promise<
    Array<{
      modelId: number;
      modelName: string;
      brandName: string;
      yearStart: number;
      yearEnd: number;
    }>
  > {
    return this.repository.manager.query(
      `SELECT mo.id_modelo AS "modelId", mo.nombre AS "modelName",
              ma.nombre AS "brandName",
              mo.anio_inicio AS "yearStart", mo.anio_fin AS "yearEnd"
       FROM compatibilidad c
       INNER JOIN modelos mo ON mo.id_modelo = c.id_modelo
       INNER JOIN marcas ma ON ma.id_marca = mo.id_marca
       WHERE c.id_producto = $1
       ORDER BY ma.nombre, mo.nombre`,
      [productId],
    );
  }

  async modeloExists(modeloId: number): Promise<boolean> {
    const rows = await this.repository.manager.query<{ exists: boolean }[]>(
      `SELECT EXISTS (SELECT 1 FROM modelos WHERE id_modelo = $1) AS exists`,
      [modeloId],
    );
    return rows[0]?.exists === true;
  }

  async addCompatibility(productId: number, modeloId: number): Promise<void> {
    await this.repository.manager.query(
      `INSERT INTO compatibilidad (id_producto, id_modelo) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [productId, modeloId],
    );
  }

  async removeCompatibility(productId: number, modeloId: number): Promise<void> {
    await this.repository.manager.query(
      `DELETE FROM compatibilidad WHERE id_producto = $1 AND id_modelo = $2`,
      [productId, modeloId],
    );
  }
}
