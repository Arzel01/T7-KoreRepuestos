import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { ProductsRepository } from './products.repository';
import { ReviewsRepository } from './reviews.repository';

import type { Review } from './entities/review.entity';
import type { PaginatedReviews } from './reviews.repository';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly productsRepository: ProductsRepository,
  ) {}

  async getReviews(productId: number, dto: QueryReviewsDto): Promise<PaginatedReviews> {
    const product = await this.productsRepository.findActiveById(productId);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return this.reviewsRepository.findByProduct(productId, dto.page, dto.pageSize);
  }

  async createReview(productId: number, userId: number, dto: CreateReviewDto): Promise<Review> {
    const product = await this.productsRepository.findActiveById(productId);
    if (!product) throw new NotFoundException('Producto no encontrado');

    const existing = await this.reviewsRepository.findByProductAndUser(productId, userId);
    if (existing) {
      throw new ConflictException('Ya publicaste una reseña para este producto');
    }

    return this.reviewsRepository.create({
      productId,
      userId,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
    });
  }

  async markHelpful(reviewId: number): Promise<void> {
    const review = await this.reviewsRepository.findById(reviewId);
    if (!review) throw new NotFoundException('Reseña no encontrada');
    await this.reviewsRepository.incrementHelpful(reviewId);
  }
}
