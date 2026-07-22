// apps/api/src/identity/identity.module.ts
import { Module } from "@nestjs/common";
import { IdentityService } from "./identity.service";
import { DatabaseModule } from "@patorbit/database";

@Module({
  imports: [DatabaseModule],
  providers: [IdentityService],
  exports: [IdentityService],
})
export class IdentityModule {}
