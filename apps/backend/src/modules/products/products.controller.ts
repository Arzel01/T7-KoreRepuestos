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
  Patch,
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
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';

import { CreateCompatibilityDto } from './dto/create-compatibility.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateTechnicalSheetEntryDto } from './dto/create-technical-sheet-entry.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { SuggestProductsDto } from './dto/suggest-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { multerOptions } from './multer.config';
import { ProductImagesService } from './product-images.service';
import { ProductsService } from './products.service';
import { ReviewsService } from './reviews.service';
import { TechnicalSheetsService } from './technical-sheets.service';

import type { ProductImage } from './entities/product-image.entity';
import type { Product } from './entities/product.entity';
import type { Review } from './entities/review.entity';
import type { TechnicalSheetEntry } from './entities/technical-sheet-entry.entity';
import type { ProductSuggestion } from './products.repository';
import type { PaginatedReviews } from './reviews.repository';
import type { JwtPayload } from '../auth/dto/auth-response.dto';
import type { PaginatedResult } from '@kore/shared';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productImagesService: ProductImagesService,
    private readonly technicalSheetsService: TechnicalSheetsService,
    private readonly reviewsService: ReviewsService,
  ) {}

  // ── Catálogo público ────────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Catálogo público de productos activos (filtrable y paginado).' })
  @ApiResponse({ status: 200, description: 'Lista paginada de productos.' })
  findAll(
    @Query() query: QueryProductsDto,
    @CurrentUser() user?: JwtPayload,
  ): Promise<PaginatedResult<Product>> {
    return this.productsService.findCatalog(query, user ? Number(user.sub) : undefined);
  }

  @Public()
  @Get('suggestions')
  @ApiOperation({ summary: 'Sugerencias de búsqueda (autocomplete, mín. 2 caracteres).' })
  @ApiResponse({ status: 200, description: 'Lista de sugerencias.' })
  @ApiResponse({ status: 400, description: 'q muy corto (< 2 chars) o parámetros inválidos.' })
  getSuggestions(@Query() dto: SuggestProductsDto): Promise<ProductSuggestion[]> {
    return this.productsService.findSuggestions(dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle público de un producto activo.' })
  @ApiResponse({ status: 200, description: 'Producto encontrado.' })
  @ApiResponse({ status: 400, description: 'ID inválido (no numérico, negativo o cero).' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado o inactivo.' })
  findOne(@Param('id', ParsePositiveIntPipe) id: number): Promise<Product> {
    return this.productsService.findActiveById(id);
  }

  @Public()
  @Get(':id/compatibility')
  @ApiOperation({ summary: 'Modelos de vehículo compatibles con este producto.' })
  @ApiResponse({ status: 200, description: 'Lista de modelos compatibles.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  getCompatibility(@Param('id', ParsePositiveIntPipe) id: number): Promise<
    Array<{
      modelId: number;
      modelName: string;
      brandName: string;
      yearStart: number;
      yearEnd: number;
    }>
  > {
    return this.productsService.findCompatibility(id);
  }

  @Post(':id/compatibility')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agrega compatibilidad vehículo↔producto. Requiere Administrador.' })
  @ApiResponse({ status: 201, description: 'Compatibilidad agregada (idempotente).' })
  @ApiResponse({ status: 400, description: 'Payload inválido.' })
  @ApiResponse({ status: 404, description: 'Producto o modelo no encontrado.' })
  async addCompatibility(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body() dto: CreateCompatibilityDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.productsService.addCompatibility(id, dto.modeloId, Number(user.sub));
  }

  @Delete(':id/compatibility/:modeloId')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina compatibilidad vehículo↔producto. Requiere Administrador.' })
  @ApiResponse({ status: 204, description: 'Compatibilidad eliminada.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  async removeCompatibility(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Param('modeloId', ParsePositiveIntPipe) modeloId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.productsService.removeCompatibility(id, modeloId, Number(user.sub));
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

  @Patch(':id')
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

  // ── Reseñas ────────────────────────────────────────────────────────────────

  @Public()
  @Get(':id/reviews')
  @ApiOperation({ summary: 'Reseñas de un producto con calificación promedio.' })
  @ApiResponse({ status: 200, description: 'Lista paginada de reseñas.' })
  getReviews(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Query() dto: QueryReviewsDto,
  ): Promise<PaginatedReviews> {
    return this.reviewsService.getReviews(id, dto);
  }

  @Post(':id/reviews')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar una reseña. Requiere autenticación.' })
  @ApiResponse({ status: 201, description: 'Reseña creada.' })
  @ApiResponse({ status: 409, description: 'Ya publicaste una reseña para este producto.' })
  createReview(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Review> {
    return this.reviewsService.createReview(id, Number(user.sub), dto);
  }

  @Post(':id/reviews/:reviewId/helpful')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar una reseña como útil.' })
  @ApiResponse({ status: 204, description: 'Voto registrado.' })
  async markReviewHelpful(
    @Param('reviewId', ParsePositiveIntPipe) reviewId: number,
  ): Promise<void> {
    return this.reviewsService.markHelpful(reviewId);
  }
}
