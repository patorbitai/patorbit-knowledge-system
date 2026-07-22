// apps/api/src/audit/audit.module.ts
import { Global,Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { DatabaseModule } from "@patorbit/database";

import { AuditInterceptor } from "./audit.interceptor";
import { AuditService } from "./audit.service";

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
