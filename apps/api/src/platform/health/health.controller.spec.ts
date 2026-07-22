import { HealthCheckResult, HealthCheckService } from "@nestjs/terminus";
import { Test } from "@nestjs/testing";
import { describe, expect, it, vi } from "vitest";
import { HealthController } from "./health.controller";
import { PrismaHealthIndicator } from "./indicators/prisma.health";

function mockPrismaHealth(): PrismaHealthIndicator {
  return {
    isHealthy: vi.fn(),
  } as unknown as PrismaHealthIndicator;
}

function mockHealthCheckService(): HealthCheckService {
  return {
    check: vi.fn(),
  } as unknown as HealthCheckService;
}

describe("HealthController", () => {
  it("defers check execution to HealthCheckService", async () => {
    const prismaIndicator = mockPrismaHealth();
    const healthCheckService = mockHealthCheckService();
    const expectedResult: HealthCheckResult = {
      status: "ok",
      info: { database: { status: "up" } },
      error: {},
      details: { database: { status: "up" } },
    };

    vi.mocked(healthCheckService.check).mockResolvedValue(expectedResult);

    const controller = new HealthController(healthCheckService, prismaIndicator);
    const result = await controller.check();

    expect(result).toStrictEqual(expectedResult);
    expect(healthCheckService.check).toHaveBeenCalled();
  });
});
