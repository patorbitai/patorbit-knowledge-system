
import { Module } from '@nestjs/common';
import { ClaimService } from './claim.service';
import { ClaimController } from './claim.controller';
import { DatabaseModule } from "@patorbit/database";
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [ClaimController],
  providers: [ClaimService],
})
export class ClaimModule {}
