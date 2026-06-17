import * as fs from 'fs';
import * as path from 'path';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

    if (!ProductImagesService.validateMagicBytes(file.buffer)) {
      throw new BadRequestException('El archivo no es una imagen válida (magic bytes inválidos)');
    }

    // Persiste el buffer al disco con nombre único
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.promises.writeFile(filepath, file.buffer);

    // Genera thumbnail desde el buffer (sin leer el disco de nuevo)
    const thumbFilename = `thumb_${filename}`;
    await sharp(file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .toFile(path.join(UPLOADS_DIR, thumbFilename));

    const count = await this.imageRepo.count({ where: { productId } });
    const isPrimary = count === 0;

    const image = this.imageRepo.create({
      productId,
      url: `/uploads/${filename}`,
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

  /**
   * Verifica magic bytes del buffer para rechazar archivos con MIME falsificado.
   * Soporta JPEG (FF D8 FF), PNG (89 50 4E 47...) y WebP (RIFF....WEBP).
   */
  private static validateMagicBytes(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 12) return false;
    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
    // PNG
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    )
      return true;
    // WebP: bytes 0-3 = RIFF, bytes 8-11 = WEBP
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    )
      return true;
    return false;
  }

  private removeFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // silenciar errores de filesystem — el registro DB se borra igual
    }
  }
}
