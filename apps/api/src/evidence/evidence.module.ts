import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';

import { IdentityModule } from '../identity/identity.module';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [EvidenceController],
  providers: [EvidenceService],
})
export class EvidenceModule {}
