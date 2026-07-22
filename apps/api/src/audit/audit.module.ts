// apps/api/src/audit/audit.module.ts
import { Module, Global } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { DatabaseModule } from "@patorbit/database";
import { AuditService } from "./audit.service";
import { AuditInterceptor } from "./audit.interceptor";

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
