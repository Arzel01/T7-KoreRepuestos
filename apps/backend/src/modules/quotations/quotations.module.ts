import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartModule } from '../cart/cart.module';

import { QuotationItem } from './entities/quotation-item.entity';
import { Quotation } from './entities/quotation.entity';
import { QuotationPdfService } from './pdf/quotation-pdf.service';
import { QuotationMailerService } from './quotation-mailer.service';
import { QuotationsController } from './quotations.controller';
import { QuotationsRepository } from './quotations.repository';
import { QuotationsService } from './quotations.service';

/**
 * Módulo 4 — Cotizaciones (US#22 · Sprint 8).
 *
 * Depende de `CartModule` (exporta `CartService`) para leer el carrito del que
 * se genera la cotización. El PDF (pdfkit) y el email (nodemailer) no requieren
 * infraestructura externa: ver [[project_postgres_native_infra]].
 */
@Module({
  imports: [TypeOrmModule.forFeature([Quotation, QuotationItem]), CartModule],
  controllers: [QuotationsController],
  providers: [QuotationsRepository, QuotationsService, QuotationPdfService, QuotationMailerService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
