import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

import { ReviewsService } from './reviews.service';

import type { Product } from './entities/product.entity';
import type { Review } from './entities/review.entity';
import type { ProductsRepository } from './products.repository';
import type { ReviewsRepository } from './reviews.repository';

/**
 * Tests unitarios de ReviewsService — foco en el guardado por compra
 * (ver acceptance report US#8): antes de este cambio, cualquier usuario
 * autenticado podía reseñar cualquier producto sin haberlo comprado.
 */
describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewsRepo: jest.Mocked<
    Pick<ReviewsRepository, 'findByProductAndUser' | 'hasPurchased' | 'create'>
  >;
  let productsRepo: jest.Mocked<Pick<ProductsRepository, 'findActiveById'>>;

  const PRODUCT_ID = 5;
  const USER_ID = 7;
  const dto = { rating: 5, title: 'Excelente', comment: 'Funcionó perfecto.' };

  beforeEach(() => {
    reviewsRepo = {
      findByProductAndUser: jest.fn(),
      hasPurchased: jest.fn(),
      create: jest.fn(),
    };
    productsRepo = {
      findActiveById: jest.fn(),
    };

    service = new ReviewsService(
      reviewsRepo as unknown as ReviewsRepository,
      productsRepo as unknown as ProductsRepository,
    );
  });

  it('rechaza si el producto no existe o está inactivo', async () => {
    productsRepo.findActiveById.mockResolvedValue(null);
    await expect(service.createReview(PRODUCT_ID, USER_ID, dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rechaza una segunda reseña del mismo usuario para el mismo producto', async () => {
    productsRepo.findActiveById.mockResolvedValue({ id: PRODUCT_ID } as Product);
    reviewsRepo.findByProductAndUser.mockResolvedValue({ id: 1 } as Review);

    await expect(service.createReview(PRODUCT_ID, USER_ID, dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(reviewsRepo.hasPurchased).not.toHaveBeenCalled();
  });

  it('rechaza la reseña si el usuario nunca compró el producto', async () => {
    productsRepo.findActiveById.mockResolvedValue({ id: PRODUCT_ID } as Product);
    reviewsRepo.findByProductAndUser.mockResolvedValue(null);
    reviewsRepo.hasPurchased.mockResolvedValue(false);

    await expect(service.createReview(PRODUCT_ID, USER_ID, dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(reviewsRepo.create).not.toHaveBeenCalled();
  });

  it('permite la reseña si el usuario compró el producto (vía alguna cotización)', async () => {
    productsRepo.findActiveById.mockResolvedValue({ id: PRODUCT_ID } as Product);
    reviewsRepo.findByProductAndUser.mockResolvedValue(null);
    reviewsRepo.hasPurchased.mockResolvedValue(true);
    reviewsRepo.create.mockResolvedValue({ id: 1, ...dto } as unknown as Review);

    await service.createReview(PRODUCT_ID, USER_ID, dto);

    expect(reviewsRepo.hasPurchased).toHaveBeenCalledWith(USER_ID, PRODUCT_ID);
    expect(reviewsRepo.create).toHaveBeenCalledWith({
      productId: PRODUCT_ID,
      userId: USER_ID,
      rating: dto.rating,
      title: dto.title,
      comment: dto.comment,
    });
  });
});
