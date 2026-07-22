import { Injectable, Logger } from "@nestjs/common";
import type { CacheEntry, CacheProvider } from "../cache.provider";

interface MemoryCacheEntry {
  value: unknown;
  expiresAt?: number;
  tags?: Set<string>;
}

@Injectable()
export class InMemoryCacheProvider implements CacheProvider {
  private readonly logger = new Logger(InMemoryCacheProvider.name);
  readonly name = "memory";

  private readonly cache = new Map<string, MemoryCacheEntry>();
  private readonly tagIndex = new Map<string, Set<string>>();

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const entry = this.cache.get(key);
      if (!entry) return undefined;

      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.del(key);
        return undefined;
      }

      return entry.value as T;
    } catch (error) {
      this.logger.error(`Memory get failed for key "${key}": ${(error as Error).message}`);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
      this.cache.set(key, { value, expiresAt });

      if (ttl && this.cache.has(key)) {
        setTimeout(() => this.del(key), ttl * 1000);
      }
    } catch (error) {
      this.logger.error(`Memory set failed for key "${key}": ${(error as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const entry = this.cache.get(key);
      if (entry?.tags) {
        for (const tag of entry.tags) {
          const tagKeys = this.tagIndex.get(tag);
          if (tagKeys?.has(key)) {
            tagKeys.delete(key);
            if (tagKeys.size === 0) {
              this.tagIndex.delete(tag);
            }
          }
        }
      }
      this.cache.delete(key);
    } catch (error) {
      this.logger.error(`Memory del failed for key "${key}": ${(error as Error).message}`);
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const entry = this.cache.get(key);
      if (!entry || !entry.expiresAt) return -1;

      const remaining = Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
      return remaining || -1;
    } catch (error) {
      this.logger.error(`Memory ttl failed for key "${key}": ${(error as Error).message}`);
      return -1;
    }
  }

  async multiGet<T>(keys: string[]): Promise<(T | undefined)[]> {
    try {
      return await Promise.all(keys.map(key => this.get<T>(key)));
    } catch (error) {
      this.logger.error(`Memory multiGet failed: ${(error as Error).message}`);
      return keys.map(() => undefined);
    }
  }

  async multiSet<T>(entries: CacheEntry[]): Promise<void> {
    try {
      for (const entry of entries) {
        await this.set(entry.key, entry.value, entry.ttl);
      }
    } catch (error) {
      this.logger.error(`Memory multiSet failed: ${(error as Error).message}`);
    }
  }

  async addTags(key: string, tags: string[]): Promise<void> {
    try {
      const entry = this.cache.get(key) ?? { value: null };
      const existingTags = entry.tags || new Set<string>();
      for (const tag of tags) {
        existingTags.add(tag);
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set<string>());
        }
        this.tagIndex.get(tag)!.add(key);
      }
      entry.tags = existingTags;
      this.cache.set(key, entry);
    } catch (error) {
      this.logger.error(`Memory addTags failed for key "${key}": ${(error as Error).message}`);
    }
  }

  async getTags(key: string): Promise<string[]> {
    try {
      const entry = this.cache.get(key);
      return entry?.tags ? [...entry.tags] : [];
    } catch (error) {
      this.logger.error(`Memory getTags failed for key "${key}": ${(error as Error).message}`);
      return [];
    }
  }

  async getByTag(tag: string): Promise<CacheEntry[]> {
    try {
      const keys = this.tagIndex.get(tag);
      if (!keys) return [];

      const results: CacheEntry[] = [];
      for (const key of keys) {
        const value = await this.get(key);
        if (value !== undefined) {
          results.push({ key, value });
        }
      }
      return results;
    } catch (error) {
      this.logger.error(`Memory getByTag failed for tag "${tag}": ${(error as Error).message}`);
      return [];
    }
  }

  async deleteByTag(tag: string): Promise<void> {
    try {
      const keys = this.tagIndex.get(tag);
      if (!keys) return;

      for (const key of [...keys]) {
        await this.del(key);
      }
      this.tagIndex.delete(tag);
    } catch (error) {
      this.logger.error(`Memory deleteByTag failed for tag "${tag}": ${(error as Error).message}`);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
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

    try {
      const value = await factory();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error(`Memory getOrSet failed for key "${key}": ${(error as Error).message}`);
      throw error;
    }
  }

  generateKey(namespace: string, ...parts: string[]): string {
    return [namespace, ...parts].join(":");
  }
}
