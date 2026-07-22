
import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { DatabaseModule } from '@patorbit/database';

@Module({
  imports: [DatabaseModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
