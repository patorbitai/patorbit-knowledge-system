
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';

import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
