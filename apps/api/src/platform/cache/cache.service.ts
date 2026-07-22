import { Inject, Injectable, Logger } from "@nestjs/common";
import type { CacheEntry, CacheProvider } from "./cache.provider";
import { CACHE_PROVIDER } from "./cache.constants";

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_PROVIDER) private readonly provider: CacheProvider) {}

  get providerName(): string {
    return this.provider.name;
  }

  // ---- Core Operations ----

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.provider.get<T>(key);
    } catch (error) {
      this.logger.error(`Cache get failed for key "${key}": ${(error as Error).message}`);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.provider.set(key, value, ttl);
    } catch (error) {
      this.logger.error(`Cache set failed for key "${key}": ${(error as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.provider.del(key);
    } catch (error) {
      this.logger.error(`Cache del failed for key "${key}": ${(error as Error).message}`);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.provider.ttl(key);
    } catch (error) {
      this.logger.error(`Cache ttl failed for key "${key}": ${(error as Error).message}`);
      return -1;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return await this.provider.has(key);
    } catch (error) {
      this.logger.error(`Cache has failed for key "${key}": ${(error as Error).message}`);
      return false;
    }
  }

  // ---- Bulk Operations ----

  async multiGet<T>(keys: string[]): Promise<(T | undefined)[]> {
    try {
      return await this.provider.multiGet<T>(keys);
    } catch (error) {
      this.logger.error(`Cache multiGet failed: ${(error as Error).message}`);
      return keys.map(() => undefined);
    }
  }

  async multiSet(entries: CacheEntry[]): Promise<void> {
    try {
      await this.provider.multiSet(entries);
    } catch (error) {
      this.logger.error(`Cache multiSet failed: ${(error as Error).message}`);
    }
  }

  // ---- Tag Operations ----

  async addTags(key: string, tags: string[]): Promise<void> {
    try {
      await this.provider.addTags(key, tags);
    } catch (error) {
      this.logger.error(`Cache addTags failed for key "${key}": ${(error as Error).message}`);
    }
  }

  async getTags(key: string): Promise<string[]> {
    try {
      return await this.provider.getTags(key);
    } catch (error) {
      this.logger.error(`Cache getTags failed for key "${key}": ${(error as Error).message}`);
      return [];
    }
  }

  async getByTag(tag: string): Promise<CacheEntry[]> {
    try {
      return await this.provider.getByTag(tag);
    } catch (error) {
      this.logger.error(`Cache getByTag failed for tag "${tag}": ${(error as Error).message}`);
      return [];
    }
  }

  async deleteByTag(tag: string): Promise<void> {
    try {
      await this.provider.deleteByTag(tag);
    } catch (error) {
      this.logger.error(`Cache deleteByTag failed for tag "${tag}": ${(error as Error).message}`);
    }
  }

  // ---- Lifecycle ----

  async clear(): Promise<void> {
    try {
      await this.provider.clear();
    } catch (error) {
      this.logger.error(`Cache clear failed: ${(error as Error).message}`);
    }
  }

  // ---- Utility Operations ----

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      return await this.provider.getOrSet(key, factory, ttl);
    } catch (error) {
      this.logger.error(`Cache getOrSet failed for key "${key}": ${(error as Error).message}`);
      return await factory();
    }
  }

  generateKey(namespace: string, ...parts: string[]): string {
    return this.provider.generateKey(namespace, ...parts);
  }
}
