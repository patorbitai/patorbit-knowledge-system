import { describe, expect, it } from "vitest";
import { NoopSearchProvider } from "./noop.search-provider";

describe("NoopSearchProvider", () => {
  const provider = new NoopSearchProvider();

  it("exposes noop identity and deterministic empty return shapes", async () => {
    expect(provider.name).toBe("noop");
    await expect(provider.search({ index: "docs", query: "anything" })).resolves.toEqual({
      total: 0,
      took: 0,
      results: [],
    });
    await expect(provider.indexExists("docs")).resolves.toBe(false);
    await expect(provider.health()).resolves.toEqual({
      provider: "noop",
      status: "healthy",
      details: { mode: "noop" },
    });
  });

  it("accepts mutation and lifecycle calls without side effects", async () => {
    await expect(
      provider.index({ id: "doc-1", index: "docs", body: { title: "Ignored" } })
    ).resolves.toBeUndefined();
    await expect(provider.bulkIndex([])).resolves.toBeUndefined();
    await expect(provider.remove("docs", "doc-1")).resolves.toBeUndefined();
    await expect(provider.createIndex({ name: "docs" })).resolves.toBeUndefined();
    await expect(provider.deleteIndex("docs")).resolves.toBeUndefined();
  });
});
