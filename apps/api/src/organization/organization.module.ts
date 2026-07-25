import { Module } from '@nestjs/common';
import { DatabaseModule } from '@patorbit/database';

import { IdentityModule } from '../identity/identity.module';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
