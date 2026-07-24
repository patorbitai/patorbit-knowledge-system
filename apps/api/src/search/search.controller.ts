// apps/api/src/search/search.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { type JwtPayload } from '@patorbit/auth';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type SearchService } from './search.service';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query('q') query: string, @CurrentUser() user: JwtPayload) {
    return this.searchService.searchAll(user.sub, query);
  }
}
