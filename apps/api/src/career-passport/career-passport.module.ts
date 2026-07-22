
import { Module } from '@nestjs/common';
import { DatabaseModule } from "@patorbit/database";

import { CareerPassportController } from './career-passport.controller';
import { CareerPassportService } from './career-passport.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CareerPassportController],
  providers: [CareerPassportService],
  exports: [CareerPassportService],
})
export class CareerPassportModule {}
