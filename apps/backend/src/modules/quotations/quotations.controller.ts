import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QuotationsService } from './quotations.service';

import type { JwtPayload } from '../auth/dto/auth-response.dto';
import type {
  QuotationEmailResult,
  QuotationResponse,
  QuotationSummaryResponse,
} from '@kore/shared';
import type { Response } from 'express';

@ApiTags('quotations')
@ApiBearerAuth()
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotations: QuotationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Genera una cotización a partir del carrito del usuario (US#22).' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400, description: 'Carrito vacío.' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateQuotationDto,
  ): Promise<QuotationResponse> {
    return this.quotations.create(Number(user.sub), dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Historial de cotizaciones. Admin/Asesor Comercial ven las de todos los clientes.',
  })
  @ApiResponse({ status: 200 })
  list(@CurrentUser() user: JwtPayload): Promise<QuotationSummaryResponse[]> {
    return this.quotations.list(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una cotización (con líneas y totales).' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Cotización no encontrada.' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<QuotationResponse> {
    return this.quotations.findOne(user, id);
  }

  @Get(':id/pdf')
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Descarga el PDF de la cotización (US#22).' })
  @ApiResponse({ status: 200, description: 'PDF binario (application/pdf).' })
  @ApiResponse({ status: 404, description: 'Cotización no encontrada.' })
  async downloadPdf(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseIntPipe()) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const { filename, pdf } = await this.quotations.generatePdf(user, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdf.length),
    });
    res.end(pdf);
  }

  @Post(':id/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Envía la cotización por email con el PDF adjunto (US#22). Admin/Asesor pueden reenviar cualquiera, para cerrar la venta.',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Cotización no encontrada.' })
  email(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<QuotationEmailResult> {
    return this.quotations.email(user, id);
  }
}
