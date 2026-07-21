
import { Module } from '@nestjs/common';
import { ConfidenceService } from './confidence.service';
import { ConfidenceController } from './confidence.controller';
import { DatabaseModule } from '../../../packages/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ConfidenceController],
  providers: [ConfidenceService],
  exports: [ConfidenceService],
})
export class ConfidenceModule {}
