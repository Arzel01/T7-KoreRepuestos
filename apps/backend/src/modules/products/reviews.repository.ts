import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Review } from './entities/review.entity';

import type { User } from '../users/entities/user.entity';

export interface ReviewWithUser {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  title?: string;
  comment?: string;
  helpfulVotes: number;
  createdAt: Date;
}

export interface PaginatedReviews {
  items: ReviewWithUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  averageRating: number | null;
}

@Injectable()
export class ReviewsRepository {
  constructor(
    @InjectRepository(Review)
    private readonly repository: Repository<Review>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * ¿El usuario tiene alguna cotización (de cualquier estado) que incluya
   * este producto? Es el proxy de "compró el producto" más honesto que este
   * sistema puede dar hoy: no hay un flujo de checkout/pago separado — la
   * cotización es el único registro transaccional que existe.
   */
  async hasPurchased(userId: number, productId: number): Promise<boolean> {
    const rows = await this.dataSource.query<Array<{ exists: boolean }>>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM detalle_cotizacion d
        JOIN cotizaciones c ON c.id_cotizacion = d.id_cotizacion
        WHERE c.id_usuario = $1 AND d.id_producto = $2
      ) AS "exists"
      `,
      [userId, productId],
    );
    return rows[0].exists;
  }

  async findByProduct(
    productId: number,
    page: number,
    pageSize: number,
  ): Promise<PaginatedReviews> {
    const [reviews, total] = await this.repository.findAndCount({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const avgResult = await this.repository
      .createQueryBuilder('r')
      .select('AVG(r.calificacion)', 'avg')
      .where('r.id_producto = :productId', { productId })
      .getRawOne<{ avg: string | null }>();

    const averageRating = avgResult?.avg ? parseFloat(avgResult.avg) : null;

    const items: ReviewWithUser[] = reviews.map((r) => {
      const u = r.user as User | undefined;
      return {
        id: r.id,
        productId: r.productId,
        userId: r.userId,
        userName: u?.nombres ?? u?.email ?? 'Usuario',
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        helpfulVotes: r.helpfulVotes,
        createdAt: r.createdAt,
      };
    });

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      averageRating,
    };
  }

  findByProductAndUser(productId: number, userId: number): Promise<Review | null> {
    return this.repository.findOne({ where: { productId, userId } });
  }

  async create(data: {
    productId: number;
    userId: number;
    rating: number;
    title?: string;
    comment?: string;
  }): Promise<Review> {
    const review = this.repository.create({
      productId: data.productId,
      userId: data.userId,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
    });
    return this.repository.save(review);
  }

  async incrementHelpful(reviewId: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Review)
      .set({ helpfulVotes: () => 'votos_util + 1' })
      .where('"id_reseña" = :id', { id: reviewId })
      .execute();
  }

  findById(id: number): Promise<Review | null> {
    return this.repository.findOne({ where: { id } });
  }
}
