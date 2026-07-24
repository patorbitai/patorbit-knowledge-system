// apps/api/src/search/search.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
