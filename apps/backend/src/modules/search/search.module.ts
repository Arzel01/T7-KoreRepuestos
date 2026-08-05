import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SavedSearch } from './entities/saved-search.entity';
import { SavedSearchesController } from './saved-searches.controller';
import { SavedSearchesService } from './saved-searches.service';

@Module({
  imports: [TypeOrmModule.forFeature([SavedSearch])],
  controllers: [SavedSearchesController],
  providers: [SavedSearchesService],
})
export class SearchModule {}
