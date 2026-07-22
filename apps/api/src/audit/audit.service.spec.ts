import { describe, expect, it, vi } from "vitest";
import { AuditService } from "./audit.service";

describe("AuditService", () => {
  it("delegates event persistence to Prisma", async () => {
    const create = vi.fn().mockResolvedValue({ id: "audit-1" });
    const prisma = { auditEvent: { create } };
    const service = new AuditService(prisma as any);

    const event = {
      userId: "user-1",
      action: "user.login" as const,
      outcome: "success" as const,
      resource: "User",
      resourceId: "user-1",
      metadata: { ip: "127.0.0.1" },
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    };

    const result = await service.log(event);

    expect(result).toEqual({ id: "audit-1" });
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith({
      data: {
        ...event,
        metadata: JSON.stringify(event.metadata),
      },
    });
  });

  it("preserves optional fields when omitted", async () => {
    const create = vi.fn().mockResolvedValue({ id: "audit-2" });
    const prisma = { auditEvent: { create } };
    const service = new AuditService(prisma as any);

    await service.log({
      action: "claim.create" as const,
      outcome: "failure" as const,
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        action: "claim.create",
        outcome: "failure",
        userId: undefined,
        resource: undefined,
        resourceId: undefined,
        metadata: undefined,
        ipAddress: undefined,
        userAgent: undefined,
      },
    });
  });
});