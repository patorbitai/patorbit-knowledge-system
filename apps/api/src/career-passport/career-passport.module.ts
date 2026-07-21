
import { Module } from '@nestjs/common';
import { CareerPassportService } from './career-passport.service';
import { CareerPassportController } from './career-passport.controller';
import { DatabaseModule } from '../../../packages/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CareerPassportController],
  providers: [CareerPassportService],
  exports: [CareerPassportService],
})
export class CareerPassportModule {}
