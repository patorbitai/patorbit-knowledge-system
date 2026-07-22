import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';

import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
