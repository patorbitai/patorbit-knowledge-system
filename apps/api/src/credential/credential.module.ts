// apps/api/src/credential/credential.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from "@patorbit/database";

import { CredentialController } from './credential.controller';
import { CredentialService } from './credential.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CredentialController],
  providers: [CredentialService],
})
export class CredentialModule {}
