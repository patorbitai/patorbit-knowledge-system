import { Module } from '@nestjs/common';
import { DatabaseModule } from "@patorbit/database";

import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TimelineController],
  providers: [TimelineService],
  exports: [TimelineService],
})
export class TimelineModule {}