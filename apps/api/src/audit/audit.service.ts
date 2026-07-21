// apps/api/src/audit/audit.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../packages/database/prisma.service";
import { AuditAction } from "@patorbit/auth";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(event: {
    userId?: string;
    action: AuditAction;
    outcome: "success" | "failure";
    resource?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditEvent.create({
      data: {
        ...event,
        metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
      },
    });
  }
}
