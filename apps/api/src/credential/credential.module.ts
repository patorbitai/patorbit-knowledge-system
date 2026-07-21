// apps/api/src/credential/credential.module.ts
import { Module } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialController } from './credential.controller';
import { DatabaseModule } from '../../../packages/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CredentialController],
  providers: [CredentialService],
})
export class CredentialModule {}
