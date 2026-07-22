
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { type UpdateTrustScoreDto } from './dto/update-trust-score.dto';
import { type TrustService } from './trust.service';

@Controller('trust')
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Get(':entityType/:entityId')
  async getOrCreate(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.trustService.getOrCreate(entityType, entityId);
  }

  @Post(':entityType/:entityId/recalculate')
  async recalculate(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.trustService.recalculate(entityType, entityId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTrustScoreDto,
  ) {
    return this.trustService.update(id, dto);
  }
}
