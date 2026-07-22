
import { Module } from '@nestjs/common';
import { DatabaseModule } from "@patorbit/database";

import { ConfidenceController } from './confidence.controller';
import { ConfidenceService } from './confidence.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ConfidenceController],
  providers: [ConfidenceService],
  exports: [ConfidenceService],
})
export class ConfidenceModule {}
