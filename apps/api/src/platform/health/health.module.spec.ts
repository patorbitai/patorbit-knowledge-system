import { TerminusModule } from "@nestjs/terminus";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { DatabaseModule } from "@patorbit/database";
import { HealthController } from "./health.controller";
import { HealthModule } from "./health.module";
import { PrismaHealthIndicator } from "./indicators/prisma.health";

describe("HealthModule", () => {
  it("compiles and provides the expected controller and indicator", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideModule(DatabaseModule)
      .useModule({
        module: DatabaseModule,
        providers: [
          {
            provide: "PrismaService",
            useValue: { $queryRaw: () => Promise.resolve([{ 1n: 1 }]) },
          },
        ],
        exports: ["PrismaService"],
      })
      .compile();

    expect(moduleRef.get(HealthController)).toBeInstanceOf(HealthController);
    expect(moduleRef.get(PrismaHealthIndicator)).toBeInstanceOf(PrismaHealthIndicator);
    await moduleRef.close();
  });
});
