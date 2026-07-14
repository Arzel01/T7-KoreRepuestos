import { UserRole } from '@kore/shared';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { Roles } from '../../common/decorators/roles.decorator';

import { SearchAnalyticsService } from './search-analytics.service';

class AnalyticsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days: number = 30;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

@ApiTags('analytics')
@ApiBearerAuth()
@Roles(UserRole.ADMINISTRADOR)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: SearchAnalyticsService) {}

  @Get('searches')
  @ApiOperation({ summary: 'Top búsquedas y búsquedas sin resultados (admin).' })
  async getSearchAnalytics(@Query() query: AnalyticsQueryDto) {
    const [topTerms, zeroResultTerms] = await Promise.all([
      this.analyticsService.topSearches(query.days, query.limit),
      this.analyticsService.zeroResultSearches(query.days, query.limit),
    ]);
    return { topTerms, zeroResultTerms };
  }
}
