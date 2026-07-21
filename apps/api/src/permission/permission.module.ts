// apps/api/src/permission/permission.module.ts
import { Module } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { DatabaseModule } from "../../../packages/database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
