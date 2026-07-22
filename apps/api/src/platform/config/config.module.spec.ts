import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { APP_CONFIG, DATABASE_CONFIG, REDIS_CONFIG } from "./config.constants";
import { ConfigurationModule } from "./config.module";
import { TypedConfigService } from "./typed-config.service";

describe("ConfigurationModule", () => {
  it("provides and exports TypedConfigService and config tokens", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigurationModule],
    })
      .overrideProvider(ConfigModule)
      .useModule(
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          ignoreEnvVars: true,
          validate: () => ({
            NODE_ENV: "test",
            LOG_LEVEL: "debug",
            API_PORT: 8080,
            DATABASE_URL: "postgresql://test:test@localhost:5432/test",
            REDIS_URL: "redis://localhost:6379",
          }),
        }),
      )
      .compile();

    expect(moduleRef.get(TypedConfigService)).toBeInstanceOf(TypedConfigService);
    expect(moduleRef.get(APP_CONFIG)).toBeTypeOf("object");
    expect(moduleRef.get(DATABASE_CONFIG)).toBeTypeOf("object");
    expect(moduleRef.get(REDIS_CONFIG)).toBeTypeOf("object");
    await moduleRef.close();
  });
});
