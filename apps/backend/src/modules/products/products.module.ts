import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '../audit/audit.module';
import { CategoriesModule } from '../categories/categories.module';

import { Compatibility } from './entities/compatibility.entity';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { TechnicalSheetEntry } from './entities/technical-sheet-entry.entity';
import { ProductImagesService } from './product-images.service';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { TechnicalSheetsService } from './technical-sheets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, TechnicalSheetEntry, Compatibility]),
    CategoriesModule,
    AuditModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsRepository, ProductsService, ProductImagesService, TechnicalSheetsService],
  exports: [ProductsRepository, ProductsService],
})
export class ProductsModule {}
