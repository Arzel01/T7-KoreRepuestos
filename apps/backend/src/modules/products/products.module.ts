import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalyticsModule } from '../analytics/analytics.module';
import { AuditModule } from '../audit/audit.module';
import { CategoriesModule } from '../categories/categories.module';

import { ProductCompatibility } from './entities/product-compatibility.entity';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { Review } from './entities/review.entity';
import { TechnicalSheetEntry } from './entities/technical-sheet-entry.entity';
import { ProductImagesService } from './product-images.service';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { ReviewsRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';
import { SynonymsService } from './synonyms.service';
import { TechnicalSheetsService } from './technical-sheets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      TechnicalSheetEntry,
      Review,
      ProductCompatibility,
    ]),
    CategoriesModule,
    AuditModule,
    AnalyticsModule,
  ],
  controllers: [ProductsController],
  providers: [
    ProductsRepository,
    ProductsService,
    ProductImagesService,
    TechnicalSheetsService,
    ReviewsRepository,
    ReviewsService,
    SynonymsService,
  ],
  exports: [ProductsRepository, ProductsService, SynonymsService],
})
export class ProductsModule {}
