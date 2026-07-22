// apps/api/src/verification/verification.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from "@patorbit/database";

import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [DatabaseModule],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
