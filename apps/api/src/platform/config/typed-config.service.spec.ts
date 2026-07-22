import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { TypedConfigService } from "./typed-config.service";

describe("TypedConfigService", () => {
  let service: TypedConfigService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TypedConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const env = {
                NODE_ENV: "test",
                LOG_LEVEL: "warn",
                API_PORT: 9999,
                DATABASE_URL: "postgres://db",
                REDIS_URL: "redis://cache",
              };
              return env[key as keyof typeof env];
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get(TypedConfigService);
  });

  it("returns a typed application config", () => {
    expect(service.getAppConfig()).toEqual({
      nodeEnv: "test",
      logLevel: "warn",
      port: 9999,
    });
  });

  it("returns a typed database config", () => {
    expect(service.getDatabaseConfig()).toEqual({ databaseUrl: "postgres://db" });
  });

  it("returns an optional redis config", () => {
    expect(service.getRedisConfig()).toEqual({ redisUrl: "redis://cache" });
  });
});
