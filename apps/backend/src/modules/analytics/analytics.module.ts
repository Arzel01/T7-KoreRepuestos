import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalyticsController } from './analytics.controller';
import { SearchLog } from './entities/search-log.entity';
import { SearchAnalyticsService } from './search-analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([SearchLog])],
  controllers: [AnalyticsController],
  providers: [SearchAnalyticsService],
  exports: [SearchAnalyticsService],
})
export class AnalyticsModule {}
