
import { Module } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { DatabaseModule } from '@patorbit/database';

@Module({
  imports: [DatabaseModule],
  controllers: [TemplateController],
  providers: [TemplateService],
})
export class TemplateModule {}
