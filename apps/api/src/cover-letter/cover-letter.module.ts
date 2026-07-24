// apps/api/src/cover-letter/cover-letter.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';

import { ProfileModule } from '../profile/profile.module';
import { CoverLetterController } from './cover-letter.controller';
import { CoverLetterService } from './cover-letter.service';

@Module({
  imports: [DatabaseModule, ProfileModule],
  controllers: [CoverLetterController],
  providers: [CoverLetterService],
  exports: [CoverLetterService],
})
export class CoverLetterModule {}
