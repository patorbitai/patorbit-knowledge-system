// apps/api/src/audit/audit.module.ts
import { Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { DatabaseModule } from "../../../packages/database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
