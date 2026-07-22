import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CACHE_PROVIDER } from "./cache.constants";
import type { CacheEntry, CacheProvider } from "./cache.provider";
import { CacheService } from "./cache.service";

describe("CacheService", () => {
  let module: TestingModule;
  let service: CacheService;
  let provider: CacheProvider;

  beforeEach(async () => {
    provider = {
      name: "test-cache",
      get: vi.fn().mockResolvedValue("cached"),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      ttl: vi.fn().mockResolvedValue(30),
      multiGet: vi.fn().mockResolvedValue(["one", undefined]),
      multiSet: vi.fn().mockResolvedValue(undefined),
      addTags: vi.fn().mockResolvedValue(undefined),
      getTags: vi.fn().mockResolvedValue(["tag"]),
      getByTag: vi.fn().mockResolvedValue([{ key: "key", value: "cached" }]),
      deleteByTag: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      has: vi.fn().mockResolvedValue(true),
      getOrSet: vi.fn().mockResolvedValue("loaded"),
      generateKey: vi.fn().mockReturnValue("ns:a:b"),
    };

    module = await Test.createTestingModule({
      providers: [CacheService, { provide: CACHE_PROVIDER, useValue: provider }],
    }).compile();
    service = module.get(CacheService);
  });

  it("reports the provider name", () => {
    expect(service.providerName).toBe("test-cache");
  });

  it("delegates core, bulk, tag, lifecycle, and utility operations", async () => {
    const entries: CacheEntry[] = [{ key: "one", value: 1, ttl: 20 }];
    const factory = vi.fn().mockResolvedValue("loaded");

    await expect(service.get("key")).resolves.toBe("cached");
    await service.set("key", "value", 60);
    await service.del("key");
    await expect(service.ttl("key")).resolves.toBe(30);
    await expect(service.has("key")).resolves.toBe(true);
    await expect(service.multiGet(["one", "two"])).resolves.toEqual(["one", undefined]);
    await service.multiSet(entries);
    await service.addTags("key", ["tag"]);
    await expect(service.getTags("key")).resolves.toEqual(["tag"]);
    await expect(service.getByTag("tag")).resolves.toEqual([{ key: "key", value: "cached" }]);
    await service.deleteByTag("tag");
    await service.clear();
    await expect(service.getOrSet("key", factory, 45)).resolves.toBe("loaded");
    expect(service.generateKey("ns", "a", "b")).toBe("ns:a:b");

    expect(provider.get).toHaveBeenCalledWith("key");
    expect(provider.set).toHaveBeenCalledWith("key", "value", 60);
    expect(provider.del).toHaveBeenCalledWith("key");
    expect(provider.ttl).toHaveBeenCalledWith("key");
    expect(provider.has).toHaveBeenCalledWith("key");
    expect(provider.multiGet).toHaveBeenCalledWith(["one", "two"]);
    expect(provider.multiSet).toHaveBeenCalledWith(entries);
    expect(provider.addTags).toHaveBeenCalledWith("key", ["tag"]);
    expect(provider.getTags).toHaveBeenCalledWith("key");
    expect(provider.getByTag).toHaveBeenCalledWith("tag");
    expect(provider.deleteByTag).toHaveBeenCalledWith("tag");
    expect(provider.clear).toHaveBeenCalledOnce();
    expect(provider.getOrSet).toHaveBeenCalledWith("key", factory, 45);
    expect(provider.generateKey).toHaveBeenCalledWith("ns", "a", "b");
  });
});
