import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';

import { CategoriesService } from './categories.service';

import type { Category } from './entities/category.entity';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Devuelve solo las categorías raíz (planas).' })
  findRoots(): Promise<Category[]> {
    return this.categoriesService.findRoots();
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Devuelve el árbol completo de categorías.' })
  findTree(): Promise<Category[]> {
    return this.categoriesService.findTree();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una categoría con sus hijos directos.' })
  findOne(@Param('id', new ParseIntPipe()) id: number): Promise<Category> {
    return this.categoriesService.findById(id);
  }
}
