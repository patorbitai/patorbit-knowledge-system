import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../../packages/database/database.module";
import { OrganizationService } from "./organization.service";
import { OrganizationController } from "./organization.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
