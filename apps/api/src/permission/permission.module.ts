// apps/api/src/permission/permission.module.ts
import { Module } from "@nestjs/common";
import { DatabaseModule } from "@patorbit/database";

import { PermissionService } from "./permission.service";

@Module({
  imports: [DatabaseModule],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
