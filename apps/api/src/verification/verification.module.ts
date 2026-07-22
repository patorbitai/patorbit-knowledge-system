// apps/api/src/verification/verification.module.ts
import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { DatabaseModule } from "@patorbit/database";

@Module({
  imports: [DatabaseModule],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
