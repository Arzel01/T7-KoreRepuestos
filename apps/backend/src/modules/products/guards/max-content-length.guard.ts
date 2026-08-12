import {
  CanActivate,
  ExecutionContext,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';

import { MAX_UPLOAD_BYTES } from '../multer.config';

import type { Request } from 'express';

/**
 * Rechaza uploads que ya declaran (Content-Length) más de MAX_UPLOAD_BYTES,
 * ANTES de que multer empiece a leer el body multipart.
 *
 * Sin esto, un archivo que excede el límite de multer aborta la conexión a
 * mitad del stream (multer deja de leer, el cliente sigue enviando bytes,
 * el socket se resetea) en vez de devolver un 413 legible — ver acceptance
 * report US#4. Guards corren antes que Interceptors en el pipeline de Nest,
 * así que esto se ejecuta antes de FileInterceptor.
 */
@Injectable()
export class MaxContentLengthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const contentLength = Number(req.headers['content-length'] ?? 0);
    if (contentLength > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(
        `El archivo excede el límite de ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB`,
      );
    }
    return true;
  }
}
