
import { Module } from '@nestjs/common';
import { DatabaseModule } from "@patorbit/database";

import { IdentityModule } from '../identity/identity.module';
import { ClaimController } from './claim.controller';
import { ClaimService } from './claim.service';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [ClaimController],
  providers: [ClaimService],
})
export class ClaimModule {}
