
import { Module } from '@nestjs/common';
import { DatabaseModule } from "@patorbit/database";

import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';

@Module({
  imports: [DatabaseModule],
  controllers: [EvidenceController],
  providers: [EvidenceService],
})
export class EvidenceModule {}
