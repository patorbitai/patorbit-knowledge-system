import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
