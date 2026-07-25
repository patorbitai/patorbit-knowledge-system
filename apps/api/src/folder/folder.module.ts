// apps/api/src/folder/folder.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';

import { ProfileModule } from '../profile/profile.module';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';

@Module({
  imports: [DatabaseModule, ProfileModule],
  controllers: [FolderController],
  providers: [FolderService],
  exports: [FolderService],
})
export class FolderModule {}
