import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';

import { RecommendationsService } from './recommendations.service';

import type { RecommendedProduct } from './recommendations.service';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Productos recomendados para un producto dado.' })
  @ApiResponse({ status: 200, description: 'Lista de recomendaciones.' })
  getRecommendations(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Query('limit') limit?: string,
  ): Promise<RecommendedProduct[]> {
    return this.recommendationsService.getRecommendations(id, limit ? Number(limit) : 5);
  }

  @Public()
  @Get(':id/frequently-bought-together')
  @ApiOperation({ summary: 'Frecuentemente comprados juntos.' })
  @ApiResponse({ status: 200, description: 'Lista de productos complementarios.' })
  getFrequentlyBoughtTogether(
    @Param('id', ParsePositiveIntPipe) id: number,
  ): Promise<RecommendedProduct[]> {
    return this.recommendationsService.getFrequentlyBoughtTogether(id);
  }
}
