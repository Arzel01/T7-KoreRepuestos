import { UserRole } from '@kore/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch as HttpPatch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import { CreateProductDto } from './dto/create-product.dto';
import { CreateTechnicalSheetEntryDto } from './dto/create-technical-sheet-entry.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { multerOptions } from './multer.config';
import { ProductImagesService } from './product-images.service';
import { ProductsService } from './products.service';
import { TechnicalSheetsService } from './technical-sheets.service';

import type { ProductImage } from './entities/product-image.entity';
import type { Product } from './entities/product.entity';
import type { TechnicalSheetEntry } from './entities/technical-sheet-entry.entity';
import type { JwtPayload } from '../auth/dto/auth-response.dto';
import type { PaginatedResult } from '@kore/shared';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productImagesService: ProductImagesService,
    private readonly technicalSheetsService: TechnicalSheetsService,
  ) {}

  // ── Catálogo público ────────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Catálogo público de productos activos (filtrable y paginado).' })
  @ApiResponse({ status: 200, description: 'Lista paginada de productos.' })
  findAll(@Query() query: QueryProductsDto): Promise<PaginatedResult<Product>> {
    return this.productsService.findCatalog(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle público de un producto.' })
  @ApiResponse({ status: 200, description: 'Producto encontrado.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  findOne(@Param('id', new ParseIntPipe()) id: number): Promise<Product> {
    return this.productsService.findById(id);
  }

  // ── CRUD admin ─────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un producto. Requiere rol Administrador.' })
  @ApiResponse({ status: 201, description: 'Producto creado.' })
  @ApiResponse({ status: 400, description: 'Payload inválido (validación fallida).' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permiso (requiere Administrador).' })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: JwtPayload): Promise<Product> {
    return this.productsService.create(dto, Number(user.sub));
  }

  @Put(':id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reemplaza un producto (PUT). Requiere rol Administrador.' })
  @ApiResponse({ status: 200, description: 'Producto actualizado.' })
  @ApiResponse({ status: 400, description: 'Payload inválido (ej. price = 0).' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permiso (requiere Administrador).' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  replace(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Product> {
    return this.productsService.update(id, dto, Number(user.sub));
  }

  @HttpPatch(':id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza un producto (PATCH). Requiere rol Administrador.' })
  @ApiResponse({ status: 200, description: 'Producto actualizado.' })
  @ApiResponse({ status: 400, description: 'Payload inválido (ej. price = 0).' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permiso (requiere Administrador).' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Product> {
    return this.productsService.update(id, dto, Number(user.sub));
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactiva un producto (soft delete). Requiere rol Administrador.' })
  @ApiResponse({ status: 204, description: 'Producto desactivado (isActive = false).' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permiso (requiere Administrador).' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  async remove(
    @Param('id', new ParseIntPipe()) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.productsService.remove(id, Number(user.sub));
  }

  // ── Imágenes ───────────────────────────────────────────────────────────────

  @Public()
  @Get(':id/images')
  @ApiOperation({ summary: 'Lista imágenes de un producto.' })
  @ApiResponse({ status: 200, description: 'Lista de imágenes.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  getImages(@Param('id', new ParseIntPipe()) productId: number): Promise<ProductImage[]> {
    return this.productImagesService.findByProduct(productId);
  }

  @Post(':id/images')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Imagen JPG/PNG/WebP, máx. 5 MB.' },
      },
    },
  })
  @ApiOperation({ summary: 'Sube una imagen para un producto. Max 5 MB, JPG/PNG/WebP.' })
  @ApiResponse({ status: 201, description: 'Imagen subida y thumbnail generado.' })
  @ApiResponse({ status: 400, description: 'Archivo inválido (tipo o tamaño).' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permiso (requiere Administrador).' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  uploadImage(
    @Param('id', new ParseIntPipe()) productId: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductImage> {
    return this.productImagesService.uploadImage(productId, file, Number(user.sub));
  }

  @Delete(':id/images/:imageId')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una imagen de un producto.' })
  @ApiResponse({ status: 204, description: 'Imagen eliminada.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permiso (requiere Administrador).' })
  @ApiResponse({ status: 404, description: 'Imagen o producto no encontrado.' })
  deleteImage(
    @Param('id', new ParseIntPipe()) productId: number,
    @Param('imageId', new ParseIntPipe()) imageId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.productImagesService.deleteImage(productId, imageId, Number(user.sub));
  }

  // ── Fichas técnicas ────────────────────────────────────────────────────────

  @Public()
  @Get(':id/technical-sheet')
  @ApiOperation({ summary: 'Ficha técnica de un producto.' })
  @ApiResponse({ status: 200, description: 'Entradas de la ficha técnica.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  getTechnicalSheet(
    @Param('id', new ParseIntPipe()) productId: number,
  ): Promise<TechnicalSheetEntry[]> {
    return this.technicalSheetsService.findByProduct(productId);
  }

  @Post(':id/technical-sheet')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Añade una entrada a la ficha técnica.' })
  @ApiResponse({ status: 201, description: 'Entrada creada.' })
  @ApiResponse({ status: 400, description: 'Payload inválido.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permiso (requiere Administrador).' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  addTechnicalSheetEntry(
    @Param('id', new ParseIntPipe()) productId: number,
    @Body() dto: CreateTechnicalSheetEntryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TechnicalSheetEntry> {
    return this.technicalSheetsService.create(productId, dto, Number(user.sub));
  }

  @Delete(':id/technical-sheet/:entryId')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina una entrada de la ficha técnica.' })
  @ApiResponse({ status: 204, description: 'Entrada eliminada.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permiso (requiere Administrador).' })
  @ApiResponse({ status: 404, description: 'Entrada o producto no encontrado.' })
  removeTechnicalSheetEntry(
    @Param('id', new ParseIntPipe()) productId: number,
    @Param('entryId', new ParseIntPipe()) entryId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.technicalSheetsService.remove(productId, entryId, Number(user.sub));
  }
}
