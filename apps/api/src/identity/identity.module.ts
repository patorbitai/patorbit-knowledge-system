// apps/api/src/identity/identity.module.ts
import { Module } from "@nestjs/common";
import { DatabaseModule } from "@patorbit/database";

import { IdentityService } from "./identity.service";

@Module({
  imports: [DatabaseModule],
  providers: [IdentityService],
  exports: [IdentityService],
})
export class IdentityModule {}
