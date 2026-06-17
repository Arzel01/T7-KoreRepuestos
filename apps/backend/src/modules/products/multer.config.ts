import * as path from 'path';

import { BadRequestException } from '@nestjs/common';
import * as multer from 'multer';

import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { Request } from 'express';

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

// Usa memoryStorage para poder validar magic bytes antes de persistir al disco.
export const multerOptions: MulterOptions = {
  storage: multer.memoryStorage(),
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Solo se permiten imágenes JPG, PNG o WebP'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
};
