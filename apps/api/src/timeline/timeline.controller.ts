
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { type CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { type TimelineService } from './timeline.service';

@Controller('timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Post(':profileId')
  async create(
    @Param('profileId') profileId: string,
    @Body() dto: CreateTimelineEventDto,
  ) {
    return this.timelineService.create(profileId, dto);
  }

  @Get('profile/:profileId')
  async findByProfile(@Param('profileId') profileId: string) {
    return this.timelineService.findByProfile(profileId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.timelineService.findById(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.timelineService.delete(id);
  }
}
