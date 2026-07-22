import { Injectable, Logger } from "@nestjs/common";
import type { Cache } from "cache-manager";
import type { CacheEntry, CacheProvider } from "../cache.provider";

@Injectable()
export class RedisCacheProvider implements CacheProvider {
  private readonly logger = new Logger(RedisCacheProvider.name);
  readonly name = "redis";

  constructor(private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cache.get<T>(key);
    } catch (error) {
      this.logger.error(`Redis get failed for key "${key}": ${(error as Error).message}`);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttl);
    } catch (error) {
      this.logger.error(`Redis set failed for key "${key}": ${(error as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (error) {
      this.logger.error(`Redis del failed for key "${key}": ${(error as Error).message}`);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const store = this.cache.store as any;
      if (typeof store.ttl === "function") {
        return await store.ttl(key);
      }
      return -1;
    } catch (error) {
      this.logger.error(`Redis ttl failed for key "${key}": ${(error as Error).message}`);
      return -1;
    }
  }

  async multiGet<T>(keys: string[]): Promise<(T | undefined)[]> {
    try {
      const results = await Promise.all(keys.map(key => this.cache.get<T>(key)));
      return results;
    } catch (error) {
      this.logger.error(`Redis multiGet failed: ${(error as Error).message}`);
      return keys.map(() => undefined);
    }
  }

  async multiSet<T>(entries: CacheEntry[]): Promise<void> {
    try {
      for (const entry of entries) {
        await this.cache.set(entry.key, entry.value, entry.ttl);
      }
    } catch (error) {
      this.logger.error(`Redis multiSet failed: ${(error as Error).message}`);
    }
  }

  async addTags(key: string, tags: string[]): Promise<void> {
    try {
      const existingEntry = await this.get<CacheEntry>(key);
      const currentTags = existingEntry?.tags || [];
      const newTags = [...currentTags, ...tags.filter(t => !currentTags.includes(t))];

      if (existingEntry) {
        await this.cache.set(key, { ...existingEntry, tags: newTags }, 300);
      } else {
        await this.cache.set(key, { value: null, tags: newTags }, 300);
      }
    } catch (error) {
      this.logger.error(`Redis addTags failed for key "${key}": ${(error as Error).message}`);
    }
  }

  async getTags(key: string): Promise<string[]> {
    try {
      const entry = await this.get<CacheEntry>(key);
      return entry?.tags || [];
    } catch (error) {
      this.logger.error(`Redis getTags failed for key "${key}": ${(error as Error).message}`);
      return [];
    }
  }

  async getByTag(tag: string): Promise<CacheEntry[]> {
    try {
      // Redis store may not support tag scanning efficiently
      // This is a simplified implementation - real Redis would use sets/locals
      this.logger.warn(`Redis getByTag is not efficiently implemented for tag: ${tag}`);
      return [];
    } catch (error) {
      this.logger.error(`Redis getByTag failed for tag "${tag}": ${(error as Error).message}`);
      return [];
    }
  }

  async deleteByTag(tag: string): Promise<void> {
    try {
      // Redis store may not support tag deletion efficiently
      // This is a simplified implementation
      this.logger.warn(`Redis deleteByTag is not efficiently implemented for tag: ${tag}`);
    } catch (error) {
      this.logger.error(`Redis deleteByTag failed for tag "${tag}": ${(error as Error).message}`);
    }
  }

  async clear(): Promise<void> {
    try {
      // Redis store may not have a clear method - would need FLUSHDB
      this.logger.warn("Redis clear() called - consider implementing FLUSHDB for full cache clear");
    } catch (error) {
      this.logger.error(`Redis clear failed: ${(error as Error).message}`);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const value = await this.cache.get(key);
      return value !== undefined;
    } catch (error) {
      this.logger.error(`Redis has failed for key "${key}": ${(error as Error).message}`);
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Implement stampede protection: lock while loading
    const lockKey = `${key}:lock`;
    const lockTtl = Math.min(ttl ?? 300, 5); // Lock max 5 seconds

    try {
      // Try to acquire lock
      const lockSet = await this.cache.set(lockKey, "locked", lockTtl);
      if (lockSet === "OK") {
        // We acquired the lock
        const value = await factory();
        await this.set(key, value, ttl);
        await this.del(lockKey); // Release lock
        return value;
      }

      // Another instance is loading, wait and retry
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
        const cachedValue = await this.get<T>(key);
        if (cachedValue !== undefined) {
          return cachedValue;
        }
      }

      // Still no value, load ourselves
      const value = await factory();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error(`Redis getOrSet failed for key "${key}": ${(error as Error).message}`);
      return await factory();
    }
  }

  generateKey(namespace: string, ...parts: string[]): string {
    return [namespace, ...parts].join(":");
  }
}