export interface CacheEntry {
  key: string;
  value: unknown;
  ttl?: number;
  createdAt?: number;
  tags?: string[];
}

export interface CacheProvider {
  readonly name: string;

  // Core operations
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  ttl(key: string): Promise<number>;

  // Bulk operations
  multiGet<T>(keys: string[]): Promise<(T | undefined)[]>;
  multiSet<T>(entries: CacheEntry[]): Promise<void>;

  // Tag operations
  addTags(key: string, tags: string[]): Promise<void>;
  getTags(key: string): Promise<string[]>;
  getByTag(tag: string): Promise<CacheEntry[]>;
  deleteByTag(tag: string): Promise<void>;

  // Lifecycle operations
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;

  // Utility operations
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;

  // Helpers
  generateKey(namespace: string, ...parts: string[]): string;
}