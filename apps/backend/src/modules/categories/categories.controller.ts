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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import type { Category } from './entities/category.entity';
import type { JwtPayload } from '../auth/dto/auth-response.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Devuelve solo las categorías raíz (planas).' })
  @ApiResponse({ status: 200, description: 'Lista de categorías raíz.' })
  findRoots(): Promise<Category[]> {
    return this.categoriesService.findRoots();
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Devuelve el árbol completo de categorías.' })
  @ApiResponse({ status: 200, description: 'Árbol jerárquico de categorías.' })
  findTree(): Promise<Category[]> {
    return this.categoriesService.findTree();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una categoría con sus hijos directos.' })
  @ApiResponse({ status: 200, description: 'Categoría encontrada.' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  findOne(@Param('id', new ParseIntPipe()) id: number): Promise<Category> {
    return this.categoriesService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea una categoría. Requiere rol Administrador.' })
  @ApiResponse({ status: 201, description: 'Categoría creada.' })
  @ApiResponse({ status: 400, description: 'Payload inválido o parentId inexistente.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permiso (requiere Administrador).' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: JwtPayload): Promise<Category> {
    return this.categoriesService.create(dto, Number(user.sub));
  }

  @Patch(':id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualiza una categoría. Requiere rol Administrador.' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada.' })
  @ApiResponse({ status: 400, description: 'parentId apunta a sí mismo o es inválido.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permiso (requiere Administrador).' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Category> {
    return this.categoriesService.update(id, dto, Number(user.sub));
  }

  @Delete(':id')
  @Roles(UserRole.ADMINISTRADOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Elimina una categoría (sin hijos ni productos). Requiere rol Administrador.',
  })
  @ApiResponse({ status: 204, description: 'Categoría eliminada.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 403, description: 'Sin permiso (requiere Administrador).' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  @ApiResponse({
    status: 409,
    description: 'La categoría tiene subcategorías o productos activos asociados.',
  })
  async remove(
    @Param('id', new ParseIntPipe()) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.categoriesService.remove(id, Number(user.sub));
  }
}
