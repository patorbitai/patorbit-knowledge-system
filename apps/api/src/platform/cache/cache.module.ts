import { type DynamicModule, Logger,Module, type Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCache } from "cache-manager";
import redisStore from "cache-manager-redis-store";

import { CACHE_MANAGER_INSTANCE, CACHE_PROVIDER, IN_MEMORY_CACHE_PROVIDER } from "./cache.constants";
import  { type CacheProvider } from "./cache.provider";
import { CacheService } from "./cache.service";
import { InMemoryCacheProvider } from "./providers/in-memory.cache-provider";
import { RedisCacheProvider } from "./providers/redis.cache-provider";

export type CacheProviderType = "redis" | "memory";

export interface CacheModuleOptions {
  provider?: CacheProviderType;
  redisUrl?: string;
  ttl?: number;
}

@Module({})
export class PlatformCacheModule {
  static forRoot(options?: CacheModuleOptions): DynamicModule {
    const providerType = options?.provider ?? "redis";

    const cacheManagerProvider: Provider = {
      provide: CACHE_MANAGER_INSTANCE,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        if (providerType !== "redis") return null;

        const redisUrl =
          options?.redisUrl ??
          configService.get<string>("REDIS_URL", "redis://localhost:6379");

        try {
          const url = new URL(redisUrl);

          // @ts-expect-error - cache-manager-redis-store has no type defs
          const store = await (redisStore as any)({
            socket: {
              host: url.hostname,
              port: Number(url.port || 6379),
            },
            username: url.username || undefined,
            password: url.password || undefined,
            database: url.pathname ? Number(url.pathname.slice(1)) || 0 : 0,
            ttl: options?.ttl ?? 300,
          });

          return createCache(store as any);
        } catch (error) {
          Logger.warn(
            `Redis connection failed, falling back to in-memory cache: ${(error as Error).message}`,
            PlatformCacheModule.name
          );
          return null;
        }
      },
    };

    const cacheProvider: Provider = {
      provide: CACHE_PROVIDER,
      inject: [CACHE_MANAGER_INSTANCE, IN_MEMORY_CACHE_PROVIDER],
      useFactory: (
        cacheManagerInstance: any,
        inMemoryProvider: InMemoryCacheProvider
      ): CacheProvider => {
        if (cacheManagerInstance) {
          return new RedisCacheProvider(cacheManagerInstance);
        }
        Logger.warn(
          "Using in-memory cache provider (no Redis available)",
          PlatformCacheModule.name
        );
        return inMemoryProvider;
      },
    };

    const inMemoryCacheProvider: Provider = {
      provide: IN_MEMORY_CACHE_PROVIDER,
      useClass: InMemoryCacheProvider,
    };

    return {
      module: PlatformCacheModule,
      global: true,
      providers: [cacheManagerProvider, cacheProvider, inMemoryCacheProvider, CacheService],
      exports: [CacheService],
    };
  }
}
