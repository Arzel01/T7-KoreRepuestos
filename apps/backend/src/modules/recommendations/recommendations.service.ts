import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';

export interface RecommendedProduct {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId?: number | null;
}

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getRecommendations(productId: number, limit = 5): Promise<RecommendedProduct[]> {
    const source = await this.productRepo.findOne({
      where: { id: productId, isActive: true },
    });

    const base = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img')
      .where('p.is_active = TRUE')
      .andWhere('p.id_producto != :productId', { productId })
      .andWhere('p.stock_actual > 0');

    // Prioridad por categoría en JS, no en SQL: dos consultas simples + concat,
    // en vez de un ORDER BY con CASE crudo (getMany() con leftJoinAndSelect
    // dispara la subquery de paginación de TypeORM para relaciones a-muchos,
    // que exige nombres de PROPIEDAD de la entidad en orderBy — no columnas
    // SQL crudas — o revienta intentando resolver metadata inexistente).
    let products: Product[];
    if (source?.categoryId) {
      const sameCategory = await base
        .clone()
        .andWhere('p.id_categoria = :catId', { catId: source.categoryId })
        .orderBy('p.stock', 'DESC')
        .take(limit)
        .getMany();

      const remaining = limit - sameCategory.length;
      const otherCategory =
        remaining > 0
          ? await base
              .clone()
              .andWhere('(p.id_categoria != :catId OR p.id_categoria IS NULL)', {
                catId: source.categoryId,
              })
              .orderBy('p.stock', 'DESC')
              .take(remaining)
              .getMany()
          : [];

      products = [...sameCategory, ...otherCategory];
    } else {
      products = await base.orderBy('p.stock', 'DESC').take(limit).getMany();
    }

    return products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      price: p.price,
      stock: p.stock,
      categoryId: p.categoryId,
      imageUrl: p.images?.[0]?.url,
    }));
  }

  /**
   * "Frecuentemente comprados juntos" (US#9): a diferencia de
   * `getRecommendations` (mismo Category/System), esto usa co-ocurrencia
   * REAL en `detalle_cotizacion` — productos que aparecieron en las mismas
   * cotizaciones que `productId`. Si el producto aún no tiene historial de
   * compra (cold-start), cae a `getRecommendations` para no devolver vacío.
   */
  async getFrequentlyBoughtTogether(productId: number, limit = 4): Promise<RecommendedProduct[]> {
    const coPurchased = await this.productRepo.manager.query<RecommendedProduct[]>(
      `SELECT p.id_producto AS id, p.sku, p.nombre AS name,
              p.precio_base::float AS price, p.stock_actual AS stock,
              p.id_categoria AS "categoryId",
              (SELECT pi.url_imagen FROM imagenes_producto pi
               WHERE pi.id_producto = p.id_producto
               LIMIT 1) AS "imageUrl"
       FROM detalle_cotizacion d1
       JOIN detalle_cotizacion d2
         ON d2.id_cotizacion = d1.id_cotizacion AND d2.id_producto != d1.id_producto
       JOIN productos p ON p.id_producto = d2.id_producto
       WHERE d1.id_producto = $1
         AND p.is_active = TRUE
         AND p.stock_actual > 0
       GROUP BY p.id_producto, p.sku, p.nombre, p.precio_base, p.stock_actual, p.id_categoria
       ORDER BY COUNT(*) DESC, p.stock_actual DESC
       LIMIT $2`,
      [productId, limit],
    );

    if (coPurchased.length > 0) return coPurchased;
    return this.getRecommendations(productId, limit);
  }
}
