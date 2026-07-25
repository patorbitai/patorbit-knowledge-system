// apps/api/src/account/account.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';

import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
