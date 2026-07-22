import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { AuditModule } from "./audit.module";
import { AuditService } from "./audit.service";

describe("AuditModule", () => {
  it("compiles and provides AuditService", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuditModule],
    })
      .overrideProvider("PrismaService")
      .useValue({ auditEvent: { create: () => Promise.resolve({}) } })
      .compile();

    expect(moduleRef.get(AuditService)).toBeInstanceOf(AuditService);
    await moduleRef.close();
  });
});