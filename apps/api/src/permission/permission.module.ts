// apps/api/src/permission/permission.module.ts
import { Module } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { DatabaseModule } from "@patorbit/database";

@Module({
  imports: [DatabaseModule],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
