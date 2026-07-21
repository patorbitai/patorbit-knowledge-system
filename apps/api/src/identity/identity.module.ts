// apps/api/src/identity/identity.module.ts
import { Module } from "@nestjs/common";
import { IdentityService } from "./identity.service";
import { DatabaseModule } from "../../../packages/database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [IdentityService],
  exports: [IdentityService],
})
export class IdentityModule {}
