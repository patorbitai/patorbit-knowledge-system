# Platform Cache

Provides a global `CacheService` abstraction for key/value caching, TTLs, bulk operations, tags, and `getOrSet` loading.

## Usage

Import `PlatformCacheModule.forRoot({ provider: "memory", ttl: 300 })`, then inject `CacheService`. Use `generateKey()` for namespaced keys and pass TTL values in seconds.

## Providers and configuration

- `memory`: process-local storage with TTL and tag support; suitable for development, tests, and single-instance workloads.
- `redis` (default): accepts `redisUrl` or `REDIS_URL` plus a default `ttl`.

When Redis setup is unavailable, the module falls back to the in-memory provider. Cache operations also return safe defaults where possible, so cache failures do not become application failures. Memory contents are not shared across processes and are lost on restart.
