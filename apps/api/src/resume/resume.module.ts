import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { SectionModule } from './sections/section.module';
import { TemplateModule } from './templates/template.module';
import { ImportModule } from './import/import.module';

@Module({
  imports: [DatabaseModule, SectionModule, TemplateModule, ImportModule],
  controllers: [ResumeController],
  providers: [ResumeService],
  exports: [ResumeService],
})
export class ResumeModule {}
