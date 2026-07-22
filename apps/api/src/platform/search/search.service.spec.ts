import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SEARCH_PROVIDER } from "./search.constants";
import type { SearchDocument, SearchIndexDefinition, SearchProvider, SearchQuery } from "./search.provider";
import { SearchService } from "./search.service";

describe("SearchService", () => {
  let service: SearchService;
  let provider: SearchProvider;

  beforeEach(async () => {
    provider = {
      name: "test-search",
      index: vi.fn().mockResolvedValue(undefined),
      bulkIndex: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue({
        total: 1,
        took: 2,
        results: [{ id: "doc-1", score: 1, source: { title: "Result" } }],
      }),
      createIndex: vi.fn().mockResolvedValue(undefined),
      deleteIndex: vi.fn().mockResolvedValue(undefined),
      indexExists: vi.fn().mockResolvedValue(true),
      health: vi.fn().mockResolvedValue({ provider: "test-search", status: "healthy" }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SearchService, { provide: SEARCH_PROVIDER, useValue: provider }],
    }).compile();
    service = module.get(SearchService);
  });

  it("reports the provider name", () => {
    expect(service.providerName).toBe("test-search");
  });

  it("delegates document, query, index lifecycle, and health operations", async () => {
    const document: SearchDocument = { id: "doc-1", index: "docs", body: { title: "Result" } };
    const documents = [document];
    const query: SearchQuery = { index: "docs", query: "result", size: 5 };
    const definition: SearchIndexDefinition = { name: "docs", mappings: { title: "text" } };

    await service.index(document);
    await service.bulkIndex(documents);
    await service.remove("docs", "doc-1");
    await expect(service.search(query)).resolves.toEqual({
      total: 1,
      took: 2,
      results: [{ id: "doc-1", score: 1, source: { title: "Result" } }],
    });
    await service.createIndex(definition);
    await service.deleteIndex("docs");
    await expect(service.indexExists("docs")).resolves.toBe(true);
    await expect(service.health()).resolves.toEqual({
      provider: "test-search",
      status: "healthy",
    });

    expect(provider.index).toHaveBeenCalledWith(document);
    expect(provider.bulkIndex).toHaveBeenCalledWith(documents);
    expect(provider.remove).toHaveBeenCalledWith("docs", "doc-1");
    expect(provider.search).toHaveBeenCalledWith(query);
    expect(provider.createIndex).toHaveBeenCalledWith(definition);
    expect(provider.deleteIndex).toHaveBeenCalledWith("docs");
    expect(provider.indexExists).toHaveBeenCalledWith("docs");
    expect(provider.health).toHaveBeenCalledOnce();
  });
});
