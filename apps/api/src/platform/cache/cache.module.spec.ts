import { ConfigModule } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { afterEach, describe, expect, it } from "vitest";
import { PlatformCacheModule } from "./cache.module";
import { CacheService } from "./cache.service";

describe("PlatformCacheModule", () => {
  let module: TestingModule;

  afterEach(async () => {
    await module?.close();
  });

  it("compiles the full memory module and exports CacheService", async () => {
    const exportedService = Symbol("EXPORTED_CACHE_SERVICE");
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PlatformCacheModule.forRoot({ provider: "memory", ttl: 20 }),
      ],
      providers: [
        {
          provide: exportedService,
          inject: [CacheService],
          useFactory: (service: CacheService) => service,
        },
      ],
    }).compile();

    const service = module.get<CacheService>(exportedService);

    expect(service).toBeInstanceOf(CacheService);
    expect(service.providerName).toBe("memory");
    await service.set("module:key", "value", 20);
    await expect(service.get("module:key")).resolves.toBe("value");
  });
});
