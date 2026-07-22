
import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { DatabaseModule } from '@patorbit/database';

@Module({
  imports: [DatabaseModule],
  controllers: [SectionController],
  providers: [SectionService],
})
export class SectionModule {}
