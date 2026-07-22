import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryCacheProvider } from "./in-memory.cache-provider";

describe("InMemoryCacheProvider", () => {
  let provider: InMemoryCacheProvider;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    provider = new InMemoryCacheProvider();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores values, reports TTL, and expires entries", async () => {
    await provider.set("session", { id: 1 }, 5);

    await expect(provider.get("session")).resolves.toEqual({ id: 1 });
    await expect(provider.has("session")).resolves.toBe(true);
    await expect(provider.ttl("session")).resolves.toBe(5);

    await vi.advanceTimersByTimeAsync(5_000);

    await expect(provider.get("session")).resolves.toBeUndefined();
    await expect(provider.has("session")).resolves.toBe(false);
    await expect(provider.ttl("session")).resolves.toBe(-1);
  });

  it("supports bulk reads and writes", async () => {
    await provider.multiSet([
      { key: "one", value: 1 },
      { key: "two", value: 2, ttl: 10 },
    ]);

    await expect(provider.multiGet<number>(["one", "missing", "two"])).resolves.toEqual([
      1,
      undefined,
      2,
    ]);
  });

  it("indexes, reads, and deletes tagged entries", async () => {
    await provider.set("article:1", { title: "One" });
    await provider.set("article:2", { title: "Two" });
    await provider.addTags("article:1", ["articles", "featured"]);
    await provider.addTags("article:2", ["articles"]);

    await expect(provider.getTags("article:1")).resolves.toEqual(["articles", "featured"]);
    await expect(provider.getByTag("articles")).resolves.toEqual([
      { key: "article:1", value: { title: "One" } },
      { key: "article:2", value: { title: "Two" } },
    ]);

    await provider.deleteByTag("articles");

    await expect(provider.multiGet(["article:1", "article:2"])).resolves.toEqual([
      undefined,
      undefined,
    ]);
    await expect(provider.getByTag("articles")).resolves.toEqual([]);
  });

  it("loads a missing value once and reuses the cached result", async () => {
    const factory = vi.fn().mockResolvedValue({ value: 42 });

    await expect(provider.getOrSet("answer", factory, 30)).resolves.toEqual({ value: 42 });
    await expect(provider.getOrSet("answer", factory, 30)).resolves.toEqual({ value: 42 });

    expect(factory).toHaveBeenCalledOnce();
    await expect(provider.ttl("answer")).resolves.toBe(30);
  });

  it("clears all values and generates stable namespaced keys", async () => {
    await provider.set("one", 1);
    await provider.addTags("one", ["numbers"]);

    expect(provider.name).toBe("memory");
    expect(provider.generateKey("knowledge", "tenant", "item")).toBe(
      "knowledge:tenant:item"
    );

    await provider.clear();

    await expect(provider.has("one")).resolves.toBe(false);
    await expect(provider.getByTag("numbers")).resolves.toEqual([]);
  });
});
