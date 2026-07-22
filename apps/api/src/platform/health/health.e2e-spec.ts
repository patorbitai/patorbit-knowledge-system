import { NestFactory } from "@nestjs/core";
import { TerminusModule } from "@nestjs/terminus";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { HealthController } from "./health.controller";
import { PrismaHealthIndicator } from "./indicators/prisma.health";

describe("HealthController (e2e)", () => {
  let app: Awaited<ReturnType<typeof NestFactory.create>>;
  let port: number;

  beforeAll(async () => {
    app = await NestFactory.create(
      {
        module: class E2ETestApp {},
        imports: [
          TerminusModule.forRoot({ logger: false, errorLogStyle: "json" }),
          {
            module: class HealthSubModule {},
            controllers: [HealthController],
            providers: [
              {
                provide: PrismaHealthIndicator,
                useValue: {
                  isHealthy: () =>
                    Promise.resolve({ database: { status: "up" } }),
                },
              },
            ],
          },
        ],
      } as any,
      { logger: false },
    );

    app.setGlobalPrefix("api");

    const server = app.getHttpServer();
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 200 with ok status on GET /api/health", async () => {
    // Node 20 built-in fetch, no supertest dependency
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    expect(response.status).toBe(200);

    const body: any = await response.json();
    expect(body).toMatchObject({
      status: "ok",
      info: { database: { status: "up" } },
    });
  });

  it("returns a JSON content type header", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});