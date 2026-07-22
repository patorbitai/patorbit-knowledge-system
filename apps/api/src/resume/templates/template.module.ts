
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';

import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TemplateController],
  providers: [TemplateService],
})
export class TemplateModule {}
