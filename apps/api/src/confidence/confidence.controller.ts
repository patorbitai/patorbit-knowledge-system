
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { ConfidenceService } from './confidence.service';
import { UpdateConfidenceScoreDto } from './dto/update-confidence-score.dto';

@Controller('confidence')
export class ConfidenceController {
  constructor(private readonly confidenceService: ConfidenceService) {}

  @Get(':entityType/:entityId')
  async getOrCreate(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.confidenceService.getOrCreate(entityType, entityId);
  }

  @Post(':entityType/:entityId/recalculate')
  async recalculate(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.confidenceService.recalculate(entityType, entityId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateConfidenceScoreDto,
  ) {
    return this.confidenceService.update(id, dto);
  }
}
