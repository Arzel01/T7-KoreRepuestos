import { UserRole } from '@kore/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

import type { Product } from './entities/product.entity';

/**
 * API HTTP del catálogo de productos.
 *
 * Reglas de Sprint 1:
 *   · GET  /api/v1/products        → público (catálogo visible para clientes).
 *   · GET  /api/v1/products/:id    → público.
 *   · POST /api/v1/products        → protegido + rol ADMIN.
 *
 * La protección es declarativa: `@Roles(UserRole.ADMIN)` se combina con
 * el `RolesGuard` global registrado en `AuthModule` para devolver 403 si
 * el JWT corresponde a un usuario sin rol admin.
 */
@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Catálogo público de productos activos.' })
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle público de un producto.' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Product> {
    return this.productsService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un producto. Requiere rol ADMIN.' })
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }
}
