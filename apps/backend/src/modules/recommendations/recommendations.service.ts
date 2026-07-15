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

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img')
      .where('p.is_active = TRUE')
      .andWhere('p.id_producto != :productId', { productId })
      .andWhere('p.stock_actual > 0');

    if (source?.categoryId) {
      qb.orderBy(
        `CASE WHEN p.id_categoria = ${source.categoryId} THEN 0 ELSE 1 END`,
        'ASC',
      ).addOrderBy('p.stock_actual', 'DESC');
    } else {
      qb.orderBy('p.stock_actual', 'DESC');
    }

    qb.take(limit);
    const products = await qb.getMany();

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

  async getFrequentlyBoughtTogether(productId: number, limit = 4): Promise<RecommendedProduct[]> {
    return this.productRepo.manager.query<RecommendedProduct[]>(
      `SELECT p.id_producto AS id, p.sku, p.nombre AS name,
              p.precio_base::float AS price, p.stock_actual AS stock,
              p.id_categoria AS "categoryId",
              (SELECT pi.url FROM imagenes_producto pi
               WHERE pi.id_producto = p.id_producto
               LIMIT 1) AS "imageUrl"
       FROM productos p
       WHERE p.is_active = TRUE
         AND p.id_producto != $1
         AND p.stock_actual > 0
         AND p.id_categoria = (
           SELECT id_categoria FROM productos WHERE id_producto = $1
         )
       ORDER BY p.stock_actual DESC
       LIMIT $2`,
      [productId, limit],
    );
  }
}
