
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { TrustService } from './trust.service';
import { UpdateTrustScoreDto } from './dto/update-trust-score.dto';

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
