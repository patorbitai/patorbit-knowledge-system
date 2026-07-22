
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';

import { SectionController } from './section.controller';
import { SectionService } from './section.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SectionController],
  providers: [SectionService],
})
export class SectionModule {}
