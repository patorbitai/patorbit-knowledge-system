import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';

import { ProfileModule } from '../profile/profile.module';
import { JobApplicationController } from './job-application.controller';
import { JobApplicationService } from './job-application.service';

@Module({
  imports: [DatabaseModule, ProfileModule],
  controllers: [JobApplicationController],
  providers: [JobApplicationService],
  exports: [JobApplicationService],
})
export class JobApplicationModule {}
