import * as fs from 'fs';
import * as path from 'path';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import sharp from 'sharp';
import { Repository } from 'typeorm';

import { AuditLogService } from '../audit/audit-log.service';

import { ProductImage } from './entities/product-image.entity';
import { UPLOADS_DIR } from './multer.config';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    private readonly productsRepository: ProductsRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async uploadImage(
    productId: number,
    file: Express.Multer.File,
    userId: number,
  ): Promise<ProductImage> {
    const product = await this.productsRepository.findById(productId);
    if (!product) throw new NotFoundException('Producto no encontrado');

    const thumbFilename = `thumb_${file.filename}`;
    await sharp(file.path)
      .resize(200, 200, { fit: 'cover' })
      .toFile(path.join(UPLOADS_DIR, thumbFilename));

    const count = await this.imageRepo.count({ where: { productId } });
    const isPrimary = count === 0;

    const image = this.imageRepo.create({
      productId,
      url: `/uploads/${file.filename}`,
      isPrimary,
    });
    const saved = await this.imageRepo.save(image);

    await this.auditLogService.log({
      userId,
      tableName: 'imagenes_producto',
      action: 'INSERT',
      description: `Imagen ${saved.id} añadida al producto ${productId}`,
    });

    return saved;
  }

  async deleteImage(productId: number, imageId: number, userId: number): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException('Imagen no encontrada');

    const filename = path.basename(image.url);
    this.removeFile(path.join(UPLOADS_DIR, filename));
    this.removeFile(path.join(UPLOADS_DIR, `thumb_${filename}`));

    await this.imageRepo.delete(imageId);

    if (image.isPrimary) {
      const next = await this.imageRepo.findOne({ where: { productId } });
      if (next) {
        await this.imageRepo.update(next.id, { isPrimary: true });
      }
    }

    await this.auditLogService.log({
      userId,
      tableName: 'imagenes_producto',
      action: 'DELETE',
      description: `Imagen ${imageId} eliminada del producto ${productId}`,
    });
  }

  async findByProduct(productId: number): Promise<ProductImage[]> {
    return this.imageRepo.find({ where: { productId }, order: { isPrimary: 'DESC', id: 'ASC' } });
  }

  private removeFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // silenciar errores de filesystem — el registro DB se borra igual
    }
  }
}
